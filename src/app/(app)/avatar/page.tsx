import { redirect } from "next/navigation";

import { AvatarReferenceGenerator } from "@/components/avatar/avatar-reference-generator";
import { hasSupabaseConfig } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { createSignedImageUrl } from "@/lib/wardrobe";

const referenceLabels = ["Front", "Back", "Left", "Right"];

export const dynamic = "force-dynamic";

export default async function AvatarPage({
  searchParams
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const params = await searchParams;

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
    .select("reference_photo_url,avatar_reference_paths")
    .eq("id", user.id)
    .single();
  const referencePaths = profile?.avatar_reference_paths ?? [];
  const references = await Promise.all(
    referencePaths.map(async (path, index) => ({
      path,
      label: referenceLabels[index] ?? `Reference ${index + 1}`,
      url: await createSignedImageUrl(supabase.storage, "avatars", path)
    }))
  );

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header>
        <p className="mb-2 text-xs uppercase tracking-[0.22em] text-muted-foreground">
          Identity reference
        </p>
        <h1 className="editorial-heading">Avatar</h1>
      </header>

      {params.message ? (
        <p className="rounded-lg border border-border bg-parchment px-4 py-3 text-sm text-muted-foreground">
          {params.message}
        </p>
      ) : null}

      <AvatarReferenceGenerator
        hasReferencePhoto={Boolean(profile?.reference_photo_url)}
        references={references}
      />
    </div>
  );
}
