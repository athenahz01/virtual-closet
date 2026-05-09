import { itemCategories } from "@/lib/constants";
import type { TryOnCategory } from "@/lib/providers/try-on/types";
import type { Database } from "@/lib/supabase/database.types";

export type ItemRow = Database["public"]["Tables"]["items"]["Row"];
export type OutfitRow = Database["public"]["Tables"]["outfits"]["Row"];

export type ClosetItemView = ItemRow & {
  imageSrc: string | null;
};

export function getCategoryLabel(category: string) {
  return (
    itemCategories.find((itemCategory) => itemCategory.value === category)
      ?.label ?? category
  );
}

export function formatTag(value: string) {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function getPreferredImagePath(item: ItemRow) {
  return item.image_url_processed || item.image_url;
}

export async function createSignedImageUrl(
  storage: {
    from: (bucket: string) => {
      createSignedUrl: (
        path: string,
        expiresIn: number
      ) => Promise<{ data: { signedUrl: string } | null; error: unknown }>;
    };
  },
  bucket: string,
  path: string | null
) {
  if (!path) {
    return null;
  }

  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  const { data } = await storage.from(bucket).createSignedUrl(path, 60 * 60);

  return data?.signedUrl ?? null;
}

export function parseList(values: FormDataEntryValue[]) {
  return values
    .map((value) => String(value).trim())
    .filter(Boolean);
}

export function normalizeOptionalText(value: FormDataEntryValue | null) {
  const normalized = String(value ?? "").trim();
  return normalized.length > 0 ? normalized : null;
}

export function getFileExtension(fileName: string, fallback = "jpg") {
  const extension = fileName.split(".").pop()?.toLowerCase();
  return extension && /^[a-z0-9]+$/.test(extension) && extension.length <= 5
    ? extension
    : fallback;
}

export function mapItemToTryOnCategory(
  itemCategory: string
): TryOnCategory | null {
  switch (itemCategory) {
    case "top":
      return "top";
    case "bottom":
      return "bottom";
    case "dress":
      return "dress";
    case "outerwear":
      return "outerwear";
    case "shoes":
      return "shoes";
    case "accessory":
      return "accessory";
    case "bag":
      return null;
    default:
      return null;
  }
}
