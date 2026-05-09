"use client";

import { useEffect, useRef, useState } from "react";
import { AvaturnSDK, type ExportAvatarResult } from "@avaturn/sdk";
import { ExternalLink, Save, Sparkles } from "lucide-react";

import { saveAvaturnAvatar } from "@/app/(app)/avatar/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { avaturnProvider } from "@/lib/providers/avatar/avaturn";
import { cn } from "@/lib/utils";

type AvaturnCreatorProps = {
  currentAvatarUrl: string | null;
};

export function AvaturnCreator({ currentAvatarUrl }: AvaturnCreatorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [creatorUrl, setCreatorUrl] = useState<string | null>(null);
  const [creatorError, setCreatorError] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState(currentAvatarUrl ?? "");
  const [manualUrl, setManualUrl] = useState(currentAvatarUrl ?? "");
  const [status, setStatus] = useState(
    currentAvatarUrl ? "Saved avatar loaded." : "Loading Avaturn..."
  );

  useEffect(() => {
    try {
      setCreatorUrl(avaturnProvider.getCreatorUrl());
    } catch (error) {
      setCreatorError(
        error instanceof Error ? error.message : "Avaturn not configured."
      );
    }
  }, []);

  useEffect(() => {
    if (!creatorUrl || !containerRef.current) {
      return;
    }

    const sdk = new AvaturnSDK();
    let cancelled = false;

    sdk
      .init(containerRef.current, {
        url: creatorUrl,
        iframeClassName: "h-full w-full border-0"
      })
      .then(() => {
        if (cancelled) {
          return;
        }

        setStatus("Avaturn is loaded.");
        sdk.on("export", (data: ExportAvatarResult) => {
          if (data?.url) {
            setAvatarUrl(data.url);
            setManualUrl(data.url);
            setStatus("Avatar ready to save.");
          }
        });
        sdk.on("error", (data) => {
          setCreatorError(data.message ?? "Could not load Avaturn.");
        });
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }

        setCreatorError(
          error instanceof Error ? error.message : "Could not load Avaturn."
        );
      });

    return () => {
      cancelled = true;
      sdk.destroy();

      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [creatorUrl]);

  return (
    <section className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
      <div className="overflow-hidden rounded-xl border border-border bg-cream shadow-soft">
        {creatorError ? (
          <div className="flex h-[640px] flex-col items-center justify-center gap-3 bg-parchment/75 p-8 text-center">
            <p className="font-serif text-2xl text-ink">
              Avaturn not configured
            </p>
            <p className="max-w-md text-sm text-muted-foreground">
              {creatorError}
            </p>
            <a
              href="https://developer.avaturn.me"
              target="_blank"
              rel="noreferrer"
              className="text-terracotta underline"
            >
              Sign up for a free subdomain
            </a>
          </div>
        ) : (
          <div ref={containerRef} className="h-[640px] w-full bg-cream" />
        )}
      </div>

      <div className="space-y-5 rounded-xl border border-border bg-parchment/75 p-5 shadow-soft">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-terracotta-soft text-terracotta">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-serif text-2xl font-semibold text-ink">
              Avaturn
            </h2>
            <p className="text-sm text-muted-foreground">{status}</p>
          </div>
        </div>

        <form action={saveAvaturnAvatar} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="avatarUrl">Avatar GLB URL</Label>
            <Input
              id="avatarUrl"
              name="avatarUrl"
              value={manualUrl}
              onChange={(event) => {
                setManualUrl(event.target.value);
                setAvatarUrl(event.target.value);
                setStatus("Avatar URL ready.");
              }}
              placeholder="https://...avaturn.../...glb"
            />
          </div>
          <Button className="w-full" disabled={!avatarUrl.trim()} type="submit">
            <Save className="mr-2 h-4 w-4" aria-hidden="true" />
            Save avatar
          </Button>
        </form>

        {creatorUrl ? (
          <Button asChild variant="outline" className="w-full">
            <a href={creatorUrl} target="_blank" rel="noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" aria-hidden="true" />
              Open creator
            </a>
          </Button>
        ) : null}

        <div
          className={cn(
            "rounded-lg border px-3 py-2 text-xs leading-5",
            avatarUrl
              ? "border-terracotta/35 bg-cream text-ink"
              : "border-border bg-cream/70 text-muted-foreground"
          )}
        >
          {avatarUrl
            ? "The exported model will be stored on your profile."
            : "After exporting an avatar, the GLB URL fills automatically."}
        </div>
      </div>
    </section>
  );
}
