import type { AvatarProvider } from "./types";

export const readyPlayerMeProvider: AvatarProvider = {
  name: "ready-player-me",
  getCreatorUrl() {
    const subdomain =
      process.env.NEXT_PUBLIC_READY_PLAYER_ME_SUBDOMAIN?.trim() || "demo";

    return `https://${subdomain}.readyplayer.me/avatar?frameApi`;
  },
  validateModelUrl(value) {
    if (!value.trim()) {
      return "Choose an avatar before saving.";
    }

    try {
      const url = new URL(value.trim());
      const isReadyPlayerMeModel =
        url.protocol === "https:" &&
        url.hostname === "models.readyplayer.me" &&
        url.pathname.endsWith(".glb");

      if (!isReadyPlayerMeModel) {
        return "Use a Ready Player Me GLB URL from models.readyplayer.me.";
      }

      return null;
    } catch {
      return "Use a valid Ready Player Me GLB URL.";
    }
  }
};
