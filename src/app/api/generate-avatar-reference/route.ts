import { NextResponse } from "next/server";

import { openaiImageGenProvider } from "@/lib/providers/image-gen/openai";
import { ImageGenProviderError } from "@/lib/providers/image-gen/types";
import type { Json } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

function getBlobExtension(blob: Blob) {
  if (blob.type.includes("jpeg")) {
    return "jpg";
  }

  if (blob.type.includes("webp")) {
    return "webp";
  }

  return "png";
}

function getProviderErrorStatus(error: ImageGenProviderError) {
  if (error.code === "CONFIGURATION") {
    return 500;
  }

  if (error.code === "RATE_LIMIT") {
    return 429;
  }

  return 400;
}

function parseMeasurements(measurements: Json | null) {
  if (
    !measurements ||
    typeof measurements !== "object" ||
    Array.isArray(measurements)
  ) {
    return undefined;
  }

  const bust = measurements.bust;
  const waist = measurements.waist;
  const hips = measurements.hips;

  return {
    bust: typeof bust === "string" ? bust : undefined,
    waist: typeof waist === "number" ? waist : undefined,
    hips: typeof hips === "number" ? hips : undefined
  };
}

async function downloadStorageBlob(
  supabase: Awaited<ReturnType<typeof createClient>>,
  bucket: string,
  path: string
) {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    const response = await fetch(path);

    if (!response.ok) {
      throw new Error("Could not download the reference photo.");
    }

    return response.blob();
  }

  const { data, error } = await supabase.storage.from(bucket).download(path);

  if (error || !data) {
    throw new Error(error?.message ?? "Could not download the reference photo.");
  }

  return data;
}

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("reference_photo_url,measurements")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json(
      { error: profileError?.message ?? "Profile not found." },
      { status: 404 }
    );
  }

  if (!profile.reference_photo_url) {
    return NextResponse.json(
      { error: "Upload a reference photo in Settings first." },
      { status: 400 }
    );
  }

  try {
    const referencePhotoBlob = await downloadStorageBlob(
      supabase,
      "avatars",
      profile.reference_photo_url
    );
    const result = await openaiImageGenProvider.generateAvatarReference({
      referencePhotoBlob,
      measurements: parseMeasurements(profile.measurements)
    });
    const extension = getBlobExtension(result.imageBlob);
    const path = `${user.id}/avatar-reference-${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, result.imageBlob, {
        cacheControl: "3600",
        contentType: result.imageBlob.type || "image/png",
        upsert: false
      });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_reference_paths: [path] })
      .eq("id", user.id);

    if (updateError) {
      await supabase.storage.from("avatars").remove([path]);
      throw new Error(updateError.message);
    }

    return NextResponse.json({ paths: [path] });
  } catch (error) {
    if (error instanceof ImageGenProviderError) {
      return NextResponse.json(
        {
          code: error.code,
          error: error.message,
          providerPayload: error.providerPayload ?? null
        },
        { status: getProviderErrorStatus(error) }
      );
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not generate avatar reference."
      },
      { status: 500 }
    );
  }
}
