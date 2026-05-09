export type TryOnCategory =
  | "tops"
  | "bottoms"
  | "one-pieces"
  | "outerwear"
  | "shoes"
  | "accessory";

export type TryOnProviderName =
  | "fashn-v16"
  | "modal-fashn-v15"
  | "google-vto"
  | "kling-vto";

export interface TryOnProviderInput {
  personImage: string;
  garmentImages: Array<{
    url: string;
    category: TryOnCategory;
  }>;
  pose: string;
  background: string;
}

export interface TryOnProviderResult {
  imageUrl: string;
  cost: number;
  providerPayload: unknown;
}

export interface TryOnProvider {
  name: TryOnProviderName;
  generate(input: TryOnProviderInput): Promise<TryOnProviderResult>;
}
