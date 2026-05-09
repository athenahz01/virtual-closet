export const defaultProfile = {
  displayName: "Athena",
  heightCm: 169,
  weightLbs: 112,
  measurements: {
    bust: "33B",
    waist: 24,
    hips: 27
  }
} as const;

export const navigationItems = [
  { href: "/closet", label: "Closet" },
  { href: "/avatar", label: "Avatar" },
  { href: "/try-on", label: "Try-On" },
  { href: "/outfits", label: "Outfits" },
  { href: "/calendar", label: "Calendar" },
  { href: "/settings", label: "Settings" }
] as const;
