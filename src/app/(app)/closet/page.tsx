import { redirect } from "next/navigation";

import { ClosetGrid } from "@/components/closet/closet-grid";
import { hasSupabaseConfig } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import {
  createSignedImageUrl,
  getPreferredImagePath,
  type ClosetItemView
} from "@/lib/wardrobe";

export const dynamic = "force-dynamic";

export default async function ClosetPage() {
  if (!hasSupabaseConfig()) {
    redirect("/login");
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: items } = await supabase
    .from("items")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const { data: profile } = await supabase
    .from("profiles")
    .select("avatar_asset_url")
    .eq("id", user.id)
    .single();

  const itemsWithImages: ClosetItemView[] = await Promise.all(
    (items ?? []).map(async (item) => ({
      ...item,
      imageSrc: await createSignedImageUrl(
        supabase.storage,
        "items",
        getPreferredImagePath(item)
      )
    }))
  );

  return (
    <ClosetGrid
      avatarUrl={profile?.avatar_asset_url ?? null}
      items={itemsWithImages}
    />
  );
}
