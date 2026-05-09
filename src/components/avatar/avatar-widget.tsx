"use client";

import Link from "next/link";

import { AvatarViewer } from "@/components/avatar/avatar-viewer";
import { Button } from "@/components/ui/button";

export function AvatarWidget({ modelUrl }: { modelUrl: string | null }) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-border bg-parchment/70 p-3 shadow-soft">
      <AvatarViewer compact modelUrl={modelUrl} />
      <div className="min-w-0 space-y-2">
        <p className="font-serif text-xl font-semibold leading-5 text-ink">
          Studio avatar
        </p>
        <p className="text-xs leading-5 text-muted-foreground">
          {modelUrl ? "Ready on the rail." : "Ready to create."}
        </p>
        <Button asChild size="sm" variant="outline">
          <Link href="/avatar">{modelUrl ? "View" : "Create"}</Link>
        </Button>
      </div>
    </div>
  );
}
