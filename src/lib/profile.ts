import { defaultProfile } from "./constants";
import type { Database, Json } from "./supabase/database.types";
import type { createClient as createServerClient } from "./supabase/server";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type SupabaseServerClient = Awaited<ReturnType<typeof createServerClient>>;

export async function ensureProfile(
  supabase: SupabaseServerClient,
  userId: string
) {
  const { error } = await supabase.from("profiles").upsert(
    {
      id: userId,
      display_name: defaultProfile.displayName,
      height_cm: defaultProfile.heightCm,
      weight_lbs: defaultProfile.weightLbs,
      measurements: defaultProfile.measurements as unknown as Json
    },
    { onConflict: "id", ignoreDuplicates: true }
  );

  if (error) {
    throw error;
  }
}

export function getMeasurementValue(
  measurements: Json | null,
  key: "bust" | "waist" | "hips"
) {
  if (!measurements || typeof measurements !== "object" || Array.isArray(measurements)) {
    return defaultProfile.measurements[key];
  }

  const value = measurements[key];

  return typeof value === "string" || typeof value === "number"
    ? value
    : defaultProfile.measurements[key];
}
