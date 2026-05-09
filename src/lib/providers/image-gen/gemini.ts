import {
  FinishReason,
  GoogleGenAI,
  Modality,
  type GenerateContentResponse,
  type Part
} from "@google/genai";

import type {
  GenerateAvatarReferenceInput,
  GenerateTryOnInput,
  ImageGenProvider,
  ImageGenResult
} from "./types";
import { ImageGenProviderError } from "./types";

export const GEMINI_IMAGE_MODEL = "gemini-3-pro-image-preview";

// Nano Banana Pro image generation pricing, published by Google in early 2026.
// Verify this before shipping paid usage controls.
export const COST_PER_IMAGE_USD = 0.134;

const SAFETY_RETRY_MESSAGE =
  "Sometimes Google's safety filter triggers on try-on. Please regenerate - it usually works on the second attempt.";

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (!apiKey) {
    throw new ImageGenProviderError(
      "CONFIGURATION",
      "GEMINI_API_KEY is not set. Create one at https://aistudio.google.com/apikey and add it to .env.local."
    );
  }

  return new GoogleGenAI({ apiKey });
}

async function blobToInlinePart(blob: Blob): Promise<Part> {
  const data = Buffer.from(await blob.arrayBuffer()).toString("base64");

  return {
    inlineData: {
      mimeType: blob.type || "image/png",
      data
    }
  };
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
    ? ` Keep body proportions consistent with these sizing notes: ${details.join(", ")}.`
    : "";
}

function sanitizePayload(
  response: GenerateContentResponse,
  prompt: string,
  inputCount: number
) {
  const candidate = response.candidates?.[0];

  return {
    model: GEMINI_IMAGE_MODEL,
    prompt,
    inputCount,
    responseId: response.responseId ?? null,
    modelVersion: response.modelVersion ?? null,
    finishReason: candidate?.finishReason ?? null,
    finishMessage: candidate?.finishMessage ?? null,
    promptFeedback: response.promptFeedback
      ? {
          blockReason: response.promptFeedback.blockReason ?? null,
          blockReasonMessage: response.promptFeedback.blockReasonMessage ?? null
        }
      : null,
    usageMetadata: response.usageMetadata ?? null
  };
}

function throwIfBlocked(response: GenerateContentResponse, prompt: string) {
  const blockReason = response.promptFeedback?.blockReason;
  const candidate = response.candidates?.[0];

  if (blockReason || candidate?.finishReason === FinishReason.SAFETY) {
    throw new ImageGenProviderError(
      "PROHIBITED_CONTENT",
      SAFETY_RETRY_MESSAGE,
      sanitizePayload(response, prompt, 0)
    );
  }
}

function extractImageResult(
  response: GenerateContentResponse,
  prompt: string,
  inputCount: number
): ImageGenResult {
  throwIfBlocked(response, prompt);

  const parts = response.candidates?.[0]?.content?.parts ?? [];
  const imagePart = parts.find((part) => part.inlineData?.data);

  if (!imagePart?.inlineData?.data) {
    throw new ImageGenProviderError(
      "NO_IMAGE",
      "Gemini did not return an image. Try regenerating.",
      sanitizePayload(response, prompt, inputCount)
    );
  }

  const mimeType = imagePart.inlineData.mimeType || "image/png";
  const imageBlob = new Blob(
    [Buffer.from(imagePart.inlineData.data, "base64")],
    { type: mimeType }
  );

  return {
    imageBlob,
    costUsd: COST_PER_IMAGE_USD,
    providerPayload: sanitizePayload(response, prompt, inputCount)
  };
}

function isSafetyError(error: unknown) {
  const message =
    error instanceof Error ? error.message : JSON.stringify(error ?? {});

  return /PROHIBITED_CONTENT|safety|blocked|policy|safety filter/i.test(
    message
  );
}

async function generateFromParts(parts: Part[], prompt: string) {
  try {
    const ai = getClient();

    return await ai.models.generateContent({
      model: GEMINI_IMAGE_MODEL,
      contents: parts,
      config: {
        responseModalities: [Modality.TEXT, Modality.IMAGE]
      }
    });
  } catch (error) {
    if (error instanceof ImageGenProviderError) {
      throw error;
    }

    if (isSafetyError(error)) {
      throw new ImageGenProviderError(
        "PROHIBITED_CONTENT",
        SAFETY_RETRY_MESSAGE,
        { model: GEMINI_IMAGE_MODEL, prompt }
      );
    }

    throw error;
  }
}

export const geminiImageGenProvider: ImageGenProvider = {
  name: "gemini-nano-banana-pro",
  async generateAvatarReference(input) {
    const prompt = `Generate a fashion lookbook reference image. A young woman with the same face, hair, and body proportions as the reference photo. She is standing in a clean white studio, plain white tank top and white shorts, neutral pose looking straight ahead, full body, professional fashion photography, soft even lighting, sharp focus, editorial 4K quality.${getMeasurementsCopy(
      input.measurements
    )}`;
    const parts = [
      { text: prompt },
      await blobToInlinePart(input.referencePhotoBlob)
    ];
    const response = await generateFromParts(parts, prompt);

    return extractImageResult(response, prompt, 1);
  },
  async generateTryOn(input) {
    const pose = input.pose?.trim() || "standing front";
    const background = input.background?.trim() || "studio cream";
    const prompt = `Generate a fashion lookbook image. The same woman from the first reference image, now wearing the garments shown in the additional reference images. Pose: ${pose}. Setting: ${background}. Professional fashion photography, full body, garments fit naturally with realistic fabric drape and lighting. Maintain the woman's exact face, hair, and body proportions from the first reference. Editorial 4K quality.`;
    const parts = [
      { text: prompt },
      ...(await Promise.all(input.referenceAvatarBlobs.map(blobToInlinePart))),
      ...(await Promise.all(
        input.garmentBlobs.map(({ blob }) => blobToInlinePart(blob))
      ))
    ];
    const response = await generateFromParts(parts, prompt);

    return extractImageResult(
      response,
      prompt,
      input.referenceAvatarBlobs.length + input.garmentBlobs.length
    );
  }
};
