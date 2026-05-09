export type ImageGenProviderName = "gemini-nano-banana-pro";

export type TryOnGarmentCategory =
  | "top"
  | "bottom"
  | "dress"
  | "outerwear"
  | "shoes"
  | "accessory";

export interface GenerateAvatarReferenceInput {
  referencePhotoBlob: Blob;
  measurements?: { bust?: string; waist?: number; hips?: number };
}

export interface GenerateTryOnInput {
  referenceAvatarBlobs: Blob[];
  garmentBlobs: Array<{ blob: Blob; category: TryOnGarmentCategory }>;
  pose?: string;
  background?: string;
}

export interface ImageGenResult {
  imageBlob: Blob;
  costUsd: number;
  providerPayload: unknown;
}

export interface ImageGenProvider {
  name: ImageGenProviderName;
  generateAvatarReference(
    input: GenerateAvatarReferenceInput
  ): Promise<ImageGenResult>;
  generateTryOn(input: GenerateTryOnInput): Promise<ImageGenResult>;
}

export type ImageGenProviderErrorCode =
  | "CONFIGURATION"
  | "NO_IMAGE"
  | "PROHIBITED_CONTENT";

export class ImageGenProviderError extends Error {
  code: ImageGenProviderErrorCode;
  providerPayload?: unknown;

  constructor(
    code: ImageGenProviderErrorCode,
    message: string,
    providerPayload?: unknown
  ) {
    super(message);
    this.name = "ImageGenProviderError";
    this.code = code;
    this.providerPayload = providerPayload;
  }
}
