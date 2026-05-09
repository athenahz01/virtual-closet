import { NextResponse } from "next/server";

import { geminiImageGenProvider } from "@/lib/providers/image-gen/gemini";
import {
  ImageGenProviderError,
  type TryOnGarmentCategory
} from "@/lib/providers/image-gen/types";
import type { Json } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import { getPreferredImagePath, mapItemToTryOnCategory } from "@/lib/wardrobe";

export const runtime = "nodejs";

type TryOnRequest = {
  itemIds?: unknown;
  pose?: unknown;
  background?: unknown;
};

function getBlobExtension(blob: Blob) {
  if (blob.type.includes("jpeg")) {
    return "jpg";
  }

  if (blob.type.includes("webp")) {
    return "webp";
  }

  return "png";
}

function toJson(value: unknown): Json {
  return JSON.parse(JSON.stringify(value ?? null)) as Json;
}

async function downloadStorageBlob(
  supabase: Awaited<ReturnType<typeof createClient>>,
  bucket: string,
  path: string
) {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    const response = await fetch(path);

    if (!response.ok) {
      throw new Error(`Could not download ${bucket} image.`);
    }

    return response.blob();
  }

  const { data, error } = await supabase.storage.from(bucket).download(path);

  if (error || !data) {
    throw new Error(error?.message ?? `Could not download ${bucket} image.`);
  }

  return data;
}

function parseRequest(value: TryOnRequest) {
  const itemIds = Array.isArray(value.itemIds)
    ? value.itemIds
        .map((itemId) => (typeof itemId === "string" ? itemId : null))
        .filter((itemId): itemId is string => Boolean(itemId))
    : [];
  const pose = typeof value.pose === "string" ? value.pose : "standing front";
  const background =
    typeof value.background === "string" ? value.background : "studio cream";

  return { itemIds, pose, background };
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  let payload: TryOnRequest;

  try {
    payload = (await request.json()) as TryOnRequest;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { itemIds, pose, background } = parseRequest(payload);

  if (itemIds.length === 0) {
    return NextResponse.json(
      { error: "Choose at least one closet item." },
      { status: 400 }
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("avatar_reference_paths")
    .eq("id", user.id)
    .single();
  const avatarReferencePaths = profile?.avatar_reference_paths ?? [];

  if (avatarReferencePaths.length === 0) {
    return NextResponse.json(
      {
        code: "MISSING_AVATAR_REFERENCE",
        error: "Generate your reference set first to enable try-on."
      },
      { status: 409 }
    );
  }

  const { data: items, error: itemsError } = await supabase
    .from("items")
    .select("*")
    .eq("user_id", user.id)
    .in("id", itemIds);

  if (itemsError || !items) {
    return NextResponse.json(
      { error: itemsError?.message ?? "Could not load closet items." },
      { status: 500 }
    );
  }

  const orderedItems = itemIds
    .map((itemId) => items.find((item) => item.id === itemId))
    .filter((item): item is (typeof items)[number] => Boolean(item));
  const garments = orderedItems
    .map((item) => {
      const category = mapItemToTryOnCategory(item.category);

      return category ? { item, category } : null;
    })
    .filter(
      (
        garment
      ): garment is {
        item: (typeof items)[number];
        category: TryOnGarmentCategory;
      } => Boolean(garment)
    );

  if (garments.length === 0) {
    return NextResponse.json(
      { error: "Choose at least one try-on compatible item." },
      { status: 400 }
    );
  }

  const generationId = crypto.randomUUID();
  let outfitId: string | null = null;

  try {
    const referenceAvatarBlobs = await Promise.all(
      avatarReferencePaths
        .slice(0, 4)
        .map((path) => downloadStorageBlob(supabase, "avatars", path))
    );
    const garmentBlobs = await Promise.all(
      garments.map(async ({ item, category }) => ({
        blob: await downloadStorageBlob(
          supabase,
          "items",
          getPreferredImagePath(item)
        ),
        category
      }))
    );
    const result = await geminiImageGenProvider.generateTryOn({
      referenceAvatarBlobs,
      garmentBlobs,
      pose,
      background
    });
    const extension = getBlobExtension(result.imageBlob);
    const resultPath = `${user.id}/try-on-${generationId}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from("generations")
      .upload(resultPath, result.imageBlob, {
        cacheControl: "3600",
        contentType: result.imageBlob.type || "image/png",
        upsert: false
      });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const { data: outfit, error: outfitError } = await supabase
      .from("outfits")
      .insert({
        user_id: user.id,
        name: "Generated outfit",
        item_ids: itemIds,
        generated_image_url: resultPath,
        pose,
        notes: `Background: ${background}`
      })
      .select("id")
      .single();

    if (outfitError || !outfit) {
      await supabase.storage.from("generations").remove([resultPath]);
      throw new Error(outfitError?.message ?? "Could not save outfit.");
    }

    outfitId = outfit.id;

    await supabase.from("generations").insert({
      id: generationId,
      user_id: user.id,
      outfit_id: outfitId,
      provider: geminiImageGenProvider.name,
      status: "succeeded",
      cost_usd: result.costUsd,
      prompt_payload: toJson(result.providerPayload),
      result_url: resultPath
    });

    const { data: signedResult } = await supabase.storage
      .from("generations")
      .createSignedUrl(resultPath, 60 * 60);

    return NextResponse.json({
      outfitId,
      resultPath,
      imageUrl: signedResult?.signedUrl ?? null,
      costUsd: result.costUsd
    });
  } catch (error) {
    await supabase.from("generations").insert({
      id: generationId,
      user_id: user.id,
      outfit_id: outfitId,
      provider: geminiImageGenProvider.name,
      status: "failed",
      cost_usd: 0,
      prompt_payload: toJson({ itemIds, pose, background }),
      error_message:
        error instanceof Error ? error.message : "Could not generate try-on."
    });

    if (error instanceof ImageGenProviderError) {
      return NextResponse.json(
        {
          code: error.code,
          error: error.message,
          providerPayload: error.providerPayload ?? null
        },
        { status: error.code === "CONFIGURATION" ? 500 : 400 }
      );
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Could not generate try-on."
      },
      { status: 500 }
    );
  }
}
