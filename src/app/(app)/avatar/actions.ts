"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { avaturnProvider } from "@/lib/providers/avatar/avaturn";
import { createClient } from "@/lib/supabase/server";

export async function saveAvaturnAvatar(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const avatarUrl = String(formData.get("avatarUrl") ?? "").trim();
  const urlError = avaturnProvider.validateModelUrl(avatarUrl);

  if (urlError) {
    redirect(`/avatar?message=${encodeURIComponent(urlError)}`);
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      avatar_asset_url: avatarUrl,
      avatar_provider: avaturnProvider.name
    })
    .eq("id", user.id);

  if (error) {
    redirect(`/avatar?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/avatar");
  revalidatePath("/closet");
  redirect("/avatar?saved=1");
}

export async function clearAvatar() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      avatar_asset_url: null,
      avatar_provider: null
    })
    .eq("id", user.id);

  if (error) {
    redirect(`/avatar?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/avatar");
  revalidatePath("/closet");
  redirect("/avatar?cleared=1");
}
