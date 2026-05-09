import { redirect } from "next/navigation";
import { RotateCw } from "lucide-react";

import { ClearAvatarButton } from "@/components/avatar/clear-avatar-button";
import { AvatarViewer } from "@/components/avatar/avatar-viewer";
import { ReadyPlayerMeCreator } from "@/components/avatar/ready-player-me-creator";
import { hasSupabaseConfig } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AvatarPage({
  searchParams
}: {
  searchParams: Promise<{ saved?: string; cleared?: string; message?: string }>;
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
    .select("avatar_asset_url, avatar_provider")
    .eq("id", user.id)
    .single();

  const avatarUrl = profile?.avatar_asset_url ?? null;

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.22em] text-muted-foreground">
            3D mascot
          </p>
          <h1 className="editorial-heading">Avatar Studio</h1>
        </div>
        {avatarUrl ? (
          <ClearAvatarButton />
        ) : null}
      </header>

      {params.saved ? (
        <p className="rounded-lg border border-border bg-parchment px-4 py-3 text-sm text-muted-foreground">
          Avatar saved.
        </p>
      ) : null}
      {params.cleared ? (
        <p className="rounded-lg border border-border bg-parchment px-4 py-3 text-sm text-muted-foreground">
          Avatar cleared.
        </p>
      ) : null}
      {params.message ? (
        <p className="rounded-lg border border-border bg-parchment px-4 py-3 text-sm text-muted-foreground">
          {params.message}
        </p>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <AvatarViewer modelUrl={avatarUrl} />

        <div className="space-y-5 rounded-xl border border-border bg-cream/75 p-5 shadow-soft">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-terracotta-soft text-terracotta">
              <RotateCw className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-serif text-2xl font-semibold text-ink">
                Viewer
              </h2>
              <p className="text-sm text-muted-foreground">
                Rotate, zoom, and inspect the saved GLB model.
              </p>
            </div>
          </div>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-4 border-b border-border pb-3">
              <dt className="text-muted-foreground">Provider</dt>
              <dd className="text-right text-ink">
                {profile?.avatar_provider ?? "Not set"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Model</dt>
              <dd className="max-w-[210px] truncate text-right text-ink">
                {avatarUrl ?? "No model saved"}
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <ReadyPlayerMeCreator currentAvatarUrl={avatarUrl} />
    </div>
  );
}
