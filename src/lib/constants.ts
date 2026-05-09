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

export const itemCategories = [
  { value: "top", label: "Top" },
  { value: "bottom", label: "Bottom" },
  { value: "dress", label: "Dress" },
  { value: "outerwear", label: "Outerwear" },
  { value: "shoes", label: "Shoes" },
  { value: "accessory", label: "Accessory" },
  { value: "bag", label: "Bag" }
] as const;

export const seasonOptions = ["spring", "summer", "fall", "winter"] as const;

export const occasionOptions = [
  "everyday",
  "work",
  "evening",
  "travel",
  "event",
  "vacation",
  "active"
] as const;

export const colorOptions = [
  { name: "Black", hex: "#1F1B18" },
  { name: "White", hex: "#F8F5EF" },
  { name: "Cream", hex: "#EFE8DA" },
  { name: "Gray", hex: "#8A8275" },
  { name: "Blue", hex: "#4F73A8" },
  { name: "Denim", hex: "#6D86A5" },
  { name: "Green", hex: "#5F7A61" },
  { name: "Brown", hex: "#7B5236" },
  { name: "Red", hex: "#A84D44" },
  { name: "Pink", hex: "#D9A3A7" },
  { name: "Terracotta", hex: "#B8714A" },
  { name: "Gold", hex: "#C59B55" }
] as const;

export type ItemCategory = (typeof itemCategories)[number]["value"];
