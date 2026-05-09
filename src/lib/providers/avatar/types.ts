export type AvatarProviderName = "avaturn" | "ready-player-me";

export interface AvatarProvider {
  name: AvatarProviderName;
  getCreatorUrl(): string;
  validateModelUrl(value: string): string | null;
}
