"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { defaultProfile } from "@/lib/constants";
import type { Json } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

function parseNumber(value: FormDataEntryValue | null, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function getFileExtension(fileName: string) {
  const extension = fileName.split(".").pop()?.toLowerCase();
  return extension && extension.length <= 5 ? extension : "jpg";
}

export async function updateSettings(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const displayName =
    String(formData.get("displayName") ?? "").trim() ||
    defaultProfile.displayName;
  const heightCm = parseNumber(
    formData.get("heightCm"),
    defaultProfile.heightCm
  );
  const weightLbs = parseNumber(
    formData.get("weightLbs"),
    defaultProfile.weightLbs
  );
  const measurements = {
    bust:
      String(formData.get("bust") ?? "").trim() ||
      defaultProfile.measurements.bust,
    waist: parseNumber(formData.get("waist"), defaultProfile.measurements.waist),
    hips: parseNumber(formData.get("hips"), defaultProfile.measurements.hips)
  };

  let referencePhotoPath: string | undefined;
  const referencePhoto = formData.get("referencePhoto");

  if (referencePhoto instanceof File && referencePhoto.size > 0) {
    const extension = getFileExtension(referencePhoto.name);
    const path = `${user.id}/reference-photo-${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, referencePhoto, {
        cacheControl: "3600",
        contentType: referencePhoto.type || "image/jpeg",
        upsert: false
      });

    if (uploadError) {
      redirect(`/settings?message=${encodeURIComponent(uploadError.message)}`);
    }

    referencePhotoPath = path;
  }

  const { error } = await supabase.from("profiles").upsert({
    id: user.id,
    display_name: displayName,
    height_cm: heightCm,
    weight_lbs: weightLbs,
    measurements: measurements as unknown as Json,
    ...(referencePhotoPath ? { reference_photo_url: referencePhotoPath } : {})
  });

  if (error) {
    redirect(`/settings?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/settings");
  redirect("/settings?saved=1");
}
