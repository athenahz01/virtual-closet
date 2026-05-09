import { redirect } from "next/navigation";

import { TryOnBuilder } from "@/components/try-on/try-on-builder";
import { hasSupabaseConfig } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import {
  createSignedImageUrl,
  getPreferredImagePath,
  mapItemToTryOnCategory,
  type ClosetItemView
} from "@/lib/wardrobe";

export const dynamic = "force-dynamic";

export default async function TryOnPage() {
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("avatar_reference_paths")
    .eq("id", user.id)
    .single();

  if (!profile?.avatar_reference_paths?.length) {
    redirect(
      "/avatar?message=Generate%20your%20reference%20set%20first%20to%20enable%20try-on."
    );
  }

  const { data: items } = await supabase
    .from("items")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  const itemsWithImages = await Promise.all(
    (items ?? []).map(async (item) => ({
      ...item,
      imageSrc: await createSignedImageUrl(
        supabase.storage,
        "items",
        getPreferredImagePath(item)
      ),
      tryOnCategory: mapItemToTryOnCategory(item.category)
    }))
  );
  const tryOnItems = itemsWithImages.filter(
    (
      item
    ): item is ClosetItemView & {
      tryOnCategory: NonNullable<ReturnType<typeof mapItemToTryOnCategory>>;
    } => Boolean(item.tryOnCategory)
  );

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <header>
        <p className="mb-2 text-xs uppercase tracking-[0.22em] text-muted-foreground">
          AI lookbook
        </p>
        <h1 className="editorial-heading">Try-On</h1>
      </header>

      <TryOnBuilder items={tryOnItems} />
    </div>
  );
}
