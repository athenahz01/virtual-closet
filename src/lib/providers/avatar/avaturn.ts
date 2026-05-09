import type { AvatarProvider } from "./types";

export const avaturnProvider: AvatarProvider = {
  name: "avaturn",
  getCreatorUrl() {
    const subdomain = process.env.NEXT_PUBLIC_AVATURN_SUBDOMAIN?.trim();

    if (!subdomain) {
      throw new Error(
        "NEXT_PUBLIC_AVATURN_SUBDOMAIN is not set. Sign up at https://developer.avaturn.me to get a free subdomain, then add it to your .env.local."
      );
    }

    if (subdomain.startsWith("https://")) {
      return subdomain;
    }

    if (subdomain.endsWith(".avaturn.dev")) {
      return `https://${subdomain}`;
    }

    return `https://${subdomain}.avaturn.dev`;
  },
  validateModelUrl(value) {
    if (!value.trim()) {
      return "Choose an avatar before saving.";
    }

    try {
      const url = new URL(value.trim());
      const isAvaturnModel =
        url.protocol === "https:" && url.pathname.endsWith(".glb");

      if (!isAvaturnModel) {
        return "Use a GLB URL ending in .glb.";
      }

      return null;
    } catch {
      return "Use a valid GLB URL.";
    }
  }
};
