import OpenAI, { APIError, toFile, type Uploadable } from "openai";

import type {
  GenerateAvatarReferenceInput,
  GenerateTryOnInput,
  ImageGenProvider,
  ImageGenResult
} from "./types";
import { ImageGenProviderError } from "./types";

export const OPENAI_IMAGE_MODEL = "gpt-image-1";
export const OPENAI_IMAGE_SIZE = "1024x1024";
export const OPENAI_IMAGE_QUALITY = "medium";
export const COST_PER_IMAGE_USD = 0.04;

const SAFETY_RETRY_MESSAGE =
  "Sometimes OpenAI's safety filter triggers on try-on. Please regenerate - it usually works on the second attempt.";

function getClient() {
  const apiKey = process.env.OPENAI_API_KEY?.trim();

  if (!apiKey) {
    throw new ImageGenProviderError(
      "CONFIGURATION",
      "OPENAI_API_KEY is not set. Create one at https://platform.openai.com/api-keys and add it to .env.local."
    );
  }

  return new OpenAI({ apiKey });
}

function getMimeType(blob: Blob) {
  if (blob.type === "image/jpeg" || blob.type === "image/jpg") {
    return "image/jpeg";
  }

  if (blob.type === "image/webp") {
    return "image/webp";
  }

  return "image/png";
}

function getExtension(mimeType: string) {
  if (mimeType === "image/jpeg") {
    return "jpg";
  }

  if (mimeType === "image/webp") {
    return "webp";
  }

  return "png";
}

async function blobToUploadable(blob: Blob, index: number): Promise<Uploadable> {
  const mimeType = getMimeType(blob);

  return toFile(
    Buffer.from(await blob.arrayBuffer()),
    `input-${index}.${getExtension(mimeType)}`,
    { type: mimeType }
  );
}

function getMeasurementsCopy(
  measurements: GenerateAvatarReferenceInput["measurements"]
) {
  if (!measurements) {
    return "";
  }

  const details = [
    measurements.bust ? `bust ${measurements.bust}` : null,
    measurements.waist ? `waist ${measurements.waist}` : null,
    measurements.hips ? `hips ${measurements.hips}` : null
  ].filter(Boolean);

  return details.length > 0
    ? ` Sizing notes for body proportions: ${details.join(", ")}.`
    : "";
}

function sanitizePayload(prompt: string, imageCount: number, usage?: unknown) {
  return {
    model: OPENAI_IMAGE_MODEL,
    prompt,
    imageCount,
    quality: OPENAI_IMAGE_QUALITY,
    size: OPENAI_IMAGE_SIZE,
    usage: usage ?? null
  };
}

function mapOpenAIError(error: unknown): never {
  if (error instanceof APIError) {
    const message = error.message ?? "OpenAI image generation failed.";
    const lowerMessage = message.toLowerCase();

    if (
      error.status === 400 &&
      error.code === "content_policy_violation"
    ) {
      throw new ImageGenProviderError(
        "PROHIBITED_CONTENT",
        SAFETY_RETRY_MESSAGE,
        { status: error.status, code: error.code, type: error.type }
      );
    }

    if (error.status === 401) {
      throw new ImageGenProviderError(
        "CONFIGURATION",
        "OpenAI authentication failed. Check OPENAI_API_KEY in .env.local.",
        { status: error.status, code: error.code, type: error.type }
      );
    }

    if (error.status === 429 && lowerMessage.includes("insufficient_quota")) {
      throw new ImageGenProviderError(
        "CONFIGURATION",
        "OpenAI credits exhausted. Add credits at platform.openai.com.",
        { status: error.status, code: error.code, type: error.type }
      );
    }

    if (error.status === 429) {
      throw new ImageGenProviderError(
        "RATE_LIMIT",
        "OpenAI is rate limiting image generation. Wait a moment, then try again.",
        { status: error.status, code: error.code, type: error.type }
      );
    }
  }

  throw error;
}

async function editImage(
  imageBlobs: Blob[],
  prompt: string
): Promise<ImageGenResult> {
  try {
    const openai = getClient();
    const image = await Promise.all(imageBlobs.map(blobToUploadable));
    const response = await openai.images.edit({
      model: OPENAI_IMAGE_MODEL,
      image,
      prompt,
      n: 1,
      quality: OPENAI_IMAGE_QUALITY,
      size: OPENAI_IMAGE_SIZE
    });
    const b64 = response.data?.[0]?.b64_json;

    if (!b64) {
      throw new ImageGenProviderError(
        "NO_IMAGE",
        "OpenAI did not return an image. Try regenerating.",
        sanitizePayload(prompt, imageBlobs.length, response.usage)
      );
    }

    return {
      imageBlob: new Blob([Buffer.from(b64, "base64")], {
        type: "image/png"
      }),
      costUsd: COST_PER_IMAGE_USD,
      providerPayload: sanitizePayload(prompt, imageBlobs.length, response.usage)
    };
  } catch (error) {
    if (error instanceof ImageGenProviderError) {
      throw error;
    }

    mapOpenAIError(error);
  }
}

export const openaiImageGenProvider: ImageGenProvider = {
  name: "openai-gpt-image",
  async generateAvatarReference(input) {
    // TODO: OpenAI blocks identity-preserving clothing edits more often, so these
    // prompts use "a young woman" framing. Character consistency is weaker than
    // the earlier Gemini plan, but this fits OpenAI's safety behavior better.
    const prompt = `A professional fashion lookbook photograph. A young woman standing in a clean white photography studio, full body shot facing the camera, wearing a plain white tank top and white shorts, neutral relaxed pose, soft even studio lighting, sharp focus, editorial quality, photorealistic. Style and proportions inspired by the reference image.${getMeasurementsCopy(
      input.measurements
    )}`;

    return editImage([input.referencePhotoBlob], prompt);
  },
  async generateTryOn(input: GenerateTryOnInput) {
    const pose = input.pose?.trim() || "standing front";
    const background = input.background?.trim() || "studio cream";
    const prompt = `A professional fashion lookbook photograph. A young woman wearing the garments shown in the reference images, full body shot, ${pose} pose, ${background} background, soft even studio lighting, garments fit naturally with realistic fabric drape and folds, editorial quality, photorealistic.`;

    return editImage(
      [
        ...input.referenceAvatarBlobs.slice(0, 4),
        ...input.garmentBlobs.map(({ blob }) => blob)
      ],
      prompt
    );
  }
};
