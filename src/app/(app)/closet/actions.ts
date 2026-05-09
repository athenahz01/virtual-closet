"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  getFileExtension,
  normalizeOptionalText,
  parseList
} from "@/lib/wardrobe";
import { createClient } from "@/lib/supabase/server";

type ActionResult =
  | { ok: true; itemId: string }
  | { ok: false; error: string };

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return { supabase, user };
}

function getRequiredText(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();

  if (!value) {
    throw new Error(`${key} is required.`);
  }

  return value;
}

function getOptionalArray(formData: FormData, key: string) {
  const values = parseList(formData.getAll(key));
  return values.length > 0 ? values : null;
}

export async function createItem(formData: FormData): Promise<ActionResult> {
  const uploadedPaths: string[] = [];
  let supabase: Awaited<ReturnType<typeof createClient>> | null = null;

  try {
    const context = await requireUser();
    supabase = context.supabase;
    const { user } = context;
    const originalPhoto = formData.get("originalPhoto");

    if (!(originalPhoto instanceof File) || originalPhoto.size === 0) {
      return { ok: false, error: "Choose a clothing photo before saving." };
    }

    const itemId = crypto.randomUUID();
    const originalExtension = getFileExtension(originalPhoto.name);
    const originalPath = `${user.id}/${itemId}/original.${originalExtension}`;
    const processedPhoto = formData.get("processedPhoto");
    let processedPath: string | null = null;

    const { error: originalUploadError } = await supabase.storage
      .from("items")
      .upload(originalPath, originalPhoto, {
        cacheControl: "3600",
        contentType: originalPhoto.type || "image/jpeg",
        upsert: false
      });

    if (originalUploadError) {
      throw new Error(originalUploadError.message);
    }

    uploadedPaths.push(originalPath);

    if (processedPhoto instanceof File && processedPhoto.size > 0) {
      processedPath = `${user.id}/${itemId}/processed.png`;
      const { error: processedUploadError } = await supabase.storage
        .from("items")
        .upload(processedPath, processedPhoto, {
          cacheControl: "3600",
          contentType: "image/png",
          upsert: false
        });

      if (processedUploadError) {
        throw new Error(processedUploadError.message);
      }

      uploadedPaths.push(processedPath);
    }

    const { error } = await supabase.from("items").insert({
      id: itemId,
      user_id: user.id,
      name: getRequiredText(formData, "name"),
      category: getRequiredText(formData, "category"),
      subcategory: normalizeOptionalText(formData.get("subcategory")),
      brand: normalizeOptionalText(formData.get("brand")),
      color: normalizeOptionalText(formData.get("color")),
      color_hex: normalizeOptionalText(formData.get("colorHex")),
      season: getOptionalArray(formData, "season"),
      occasion: getOptionalArray(formData, "occasion"),
      image_url: originalPath,
      image_url_processed: processedPath,
      notes: normalizeOptionalText(formData.get("notes"))
    });

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath("/closet");

    return { ok: true, itemId };
  } catch (error) {
    if (supabase && uploadedPaths.length > 0) {
      await supabase.storage.from("items").remove(uploadedPaths);
    }

    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not save item."
    };
  }
}

export async function updateItem(formData: FormData) {
  const { supabase, user } = await requireUser();
  const itemId = getRequiredText(formData, "itemId");

  const { error } = await supabase
    .from("items")
    .update({
      name: getRequiredText(formData, "name"),
      category: getRequiredText(formData, "category"),
      subcategory: normalizeOptionalText(formData.get("subcategory")),
      brand: normalizeOptionalText(formData.get("brand")),
      color: normalizeOptionalText(formData.get("color")),
      color_hex: normalizeOptionalText(formData.get("colorHex")),
      season: getOptionalArray(formData, "season"),
      occasion: getOptionalArray(formData, "occasion"),
      notes: normalizeOptionalText(formData.get("notes"))
    })
    .eq("id", itemId)
    .eq("user_id", user.id);

  if (error) {
    redirect(`/closet/${itemId}/edit?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/closet");
  revalidatePath(`/closet/${itemId}`);
  redirect(`/closet/${itemId}`);
}

export async function deleteItem(formData: FormData) {
  const { supabase, user } = await requireUser();
  const itemId = getRequiredText(formData, "itemId");

  const { data: item } = await supabase
    .from("items")
    .select("image_url,image_url_processed")
    .eq("id", itemId)
    .eq("user_id", user.id)
    .single();

  const paths = [item?.image_url, item?.image_url_processed].filter(
    (path): path is string => Boolean(path)
  );

  if (paths.length > 0) {
    await supabase.storage.from("items").remove(paths);
  }

  await supabase.from("items").delete().eq("id", itemId).eq("user_id", user.id);

  revalidatePath("/closet");
  redirect("/closet");
}
