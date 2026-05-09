"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ExternalLink, Save, Sparkles } from "lucide-react";

import { saveReadyPlayerMeAvatar } from "@/app/(app)/avatar/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { readyPlayerMeProvider } from "@/lib/providers/avatar/ready-player-me";
import { cn } from "@/lib/utils";

type ReadyPlayerMeCreatorProps = {
  currentAvatarUrl: string | null;
};

function getExportedAvatarUrl(data: unknown) {
  const payload = typeof data === "string" ? safeJsonParse(data) : data;

  if (!payload || typeof payload !== "object") {
    return null;
  }

  const message = payload as {
    eventName?: string;
    source?: string;
    type?: string;
    data?: { url?: string };
  };

  if (message.source !== "readyplayerme") {
    return null;
  }

  if (
    message.eventName === "v1.avatar.exported" ||
    message.type === "v1.avatar.exported"
  ) {
    return message.data?.url ?? null;
  }

  return null;
}

function safeJsonParse(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export function ReadyPlayerMeCreator({
  currentAvatarUrl
}: ReadyPlayerMeCreatorProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const creatorUrl = useMemo(() => readyPlayerMeProvider.getCreatorUrl(), []);
  const [avatarUrl, setAvatarUrl] = useState(currentAvatarUrl ?? "");
  const [manualUrl, setManualUrl] = useState(currentAvatarUrl ?? "");
  const [status, setStatus] = useState(
    currentAvatarUrl ? "Saved avatar loaded." : "Ready Player Me is loaded."
  );

  useEffect(() => {
    function subscribeToExport() {
      iframeRef.current?.contentWindow?.postMessage(
        JSON.stringify({
          target: "readyplayerme",
          type: "subscribe",
          eventName: "v1.avatar.exported"
        }),
        "*"
      );
    }

    function handleMessage(event: MessageEvent) {
      const exportedUrl = getExportedAvatarUrl(event.data);

      if (exportedUrl) {
        setAvatarUrl(exportedUrl);
        setManualUrl(exportedUrl);
        setStatus("Avatar ready to save.");
      }

      const payload =
        typeof event.data === "string" ? safeJsonParse(event.data) : event.data;

      if (
        payload &&
        typeof payload === "object" &&
        (payload as { eventName?: string; source?: string }).source ===
          "readyplayerme" &&
        (payload as { eventName?: string; source?: string }).eventName ===
          "v1.frame.ready"
      ) {
        subscribeToExport();
      }
    }

    window.addEventListener("message", handleMessage);
    subscribeToExport();

    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return (
    <section className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
      <div className="overflow-hidden rounded-xl border border-border bg-cream shadow-soft">
        <iframe
          ref={iframeRef}
          title="Ready Player Me avatar creator"
          src={creatorUrl}
          allow="camera *; microphone *; clipboard-write"
          className="h-[640px] w-full bg-cream"
          onLoad={() => {
            setStatus("Ready Player Me is loaded.");
            iframeRef.current?.contentWindow?.postMessage(
              JSON.stringify({
                target: "readyplayerme",
                type: "subscribe",
                eventName: "v1.avatar.exported"
              }),
              "*"
            );
          }}
        />
      </div>

      <div className="space-y-5 rounded-xl border border-border bg-parchment/75 p-5 shadow-soft">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-terracotta-soft text-terracotta">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-serif text-2xl font-semibold text-ink">
              Ready Player Me
            </h2>
            <p className="text-sm text-muted-foreground">{status}</p>
          </div>
        </div>

        <form action={saveReadyPlayerMeAvatar} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="avatarUrl">Avatar GLB URL</Label>
            <p className="text-xs leading-5 text-muted-foreground">
              If the embedded creator gets stuck after "Continue without
              signup", use this field instead.
            </p>
            <Input
              id="avatarUrl"
              name="avatarUrl"
              value={manualUrl}
              onChange={(event) => {
                setManualUrl(event.target.value);
                setAvatarUrl(event.target.value);
                setStatus("Avatar URL ready.");
              }}
              placeholder="https://models.readyplayer.me/..."
            />
          </div>
          <Button
            className="w-full"
            disabled={!avatarUrl.trim()}
            type="submit"
          >
            <Save className="mr-2 h-4 w-4" aria-hidden="true" />
            Save avatar
          </Button>
        </form>

        <Button asChild variant="outline" className="w-full">
          <a href={creatorUrl} target="_blank" rel="noreferrer">
            <ExternalLink className="mr-2 h-4 w-4" aria-hidden="true" />
            Open creator
          </a>
        </Button>
        <p className="text-xs leading-5 text-muted-foreground">
          Opens in a new tab; copy the GLB URL into the field above when done.
        </p>

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
            : "The manual field is available if the embedded export is blocked."}
        </div>
      </div>
    </section>
  );
}
