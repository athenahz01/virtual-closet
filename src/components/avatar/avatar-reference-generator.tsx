"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RefreshCw, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AvatarReference = {
  path: string;
  url: string | null;
  label: string;
};

export function AvatarReferenceGenerator({
  hasReferencePhoto,
  references
}: {
  hasReferencePhoto: boolean;
  references: AvatarReference[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasReferences = references.length > 0;

  async function generateReference() {
    setError(null);
    setIsGenerating(true);

    try {
      const response = await fetch("/api/generate-avatar-reference", {
        method: "POST"
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Could not generate reference set.");
      }

      startTransition(() => {
        router.refresh();
      });
    } catch (generationError) {
      setError(
        generationError instanceof Error
          ? generationError.message
          : "Could not generate reference set."
      );
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-5 rounded-xl border border-border bg-cream/75 p-5 shadow-soft lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="flex gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-terracotta-soft text-terracotta">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-serif text-3xl font-semibold text-ink">
              {hasReferences ? "Your reference set" : "Generate your reference set"}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              We&apos;ll use the photo you uploaded in Settings to generate a clean
              studio reference of you. This is what we&apos;ll use to try on
              outfits.
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row lg:justify-end">
          {hasReferencePhoto ? (
            <Button
              disabled={isGenerating || isPending}
              onClick={generateReference}
              type="button"
            >
              <RefreshCw
                className={cn(
                  "mr-2 h-4 w-4",
                  isGenerating || isPending ? "animate-spin" : ""
                )}
                aria-hidden="true"
              />
              {hasReferences ? "Regenerate" : "Generate now"}
            </Button>
          ) : (
            <Button asChild>
              <Link href="/settings">Upload reference photo</Link>
            </Button>
          )}
        </div>
      </section>

      {error ? (
        <p className="rounded-lg border border-terracotta/30 bg-terracotta-soft/40 px-4 py-3 text-sm text-ink">
          {error}
        </p>
      ) : null}

      {isGenerating || isPending ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <div
              className="aspect-[3/4] animate-pulse rounded-xl border border-border bg-parchment shadow-soft"
              key={item}
            />
          ))}
        </div>
      ) : hasReferences ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {references.map((reference) => (
            <article
              className="overflow-hidden rounded-xl border border-border bg-cream shadow-soft"
              key={reference.path}
            >
              <div className="relative aspect-[3/4] bg-parchment">
                {reference.url ? (
                  <Image
                    alt={`${reference.label} reference`}
                    className="object-cover"
                    fill
                    sizes="(min-width: 1280px) 25vw, (min-width: 640px) 50vw, 100vw"
                    src={reference.url}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    Preview unavailable
                  </div>
                )}
              </div>
              <div className="p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  {reference.label}
                </p>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="flex min-h-96 flex-col items-center justify-center rounded-xl border border-border bg-cream/70 px-6 text-center shadow-soft">
          <p className="font-serif text-3xl font-semibold text-ink">
            No studio reference yet.
          </p>
          <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
            Generate a polished reference image before using AI try-on.
          </p>
        </div>
      )}
    </div>
  );
}
