"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  Download,
  Search,
  Share2,
  Sparkles,
  Wand2,
  X
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { itemCategories } from "@/lib/constants";
import type { TryOnCategory } from "@/lib/providers/try-on/types";
import { cn } from "@/lib/utils";
import { formatTag, getCategoryLabel, type ClosetItemView } from "@/lib/wardrobe";

type TryOnItem = ClosetItemView & {
  tryOnCategory: TryOnCategory;
};

type GenerationResult = {
  outfitId: string;
  imageUrl: string | null;
  resultPath: string;
  costUsd: number;
};

const slots: Array<{ category: TryOnCategory; label: string }> = [
  { category: "dress", label: "Dress" },
  { category: "top", label: "Top" },
  { category: "bottom", label: "Bottom" },
  { category: "outerwear", label: "Outerwear" },
  { category: "shoes", label: "Shoes" },
  { category: "accessory", label: "Accessory" }
];

const poses = ["standing front", "three-quarter", "walking", "candid sitting"];
const backgrounds = ["studio cream", "street", "indoor home"];
const loadingMessages = [
  "Loading reference",
  "Composing outfit",
  "Generating image..."
];

export function TryOnBuilder({ items }: { items: TryOnItem[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"all" | TryOnCategory>("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [pose, setPose] = useState(poses[0]);
  const [background, setBackground] = useState(backgrounds[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingIndex, setLoadingIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isSafetyError, setIsSafetyError] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [shareMessage, setShareMessage] = useState<string | null>(null);

  const itemById = useMemo(
    () => new Map(items.map((item) => [item.id, item])),
    [items]
  );
  const selectedItems = selectedIds
    .map((id) => itemById.get(id))
    .filter((item): item is TryOnItem => Boolean(item));
  const filteredItems = useMemo(() => {
    const lowerQuery = query.trim().toLowerCase();

    return items.filter((item) => {
      if (category !== "all" && item.tryOnCategory !== category) {
        return false;
      }

      if (!lowerQuery) {
        return true;
      }

      return [item.name, item.brand, item.subcategory, item.color]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(lowerQuery));
    });
  }, [category, items, query]);

  useEffect(() => {
    if (!isGenerating) {
      return;
    }

    const interval = window.setInterval(() => {
      setLoadingIndex((current) =>
        current >= loadingMessages.length - 1 ? current : current + 1
      );
    }, 1800);

    return () => window.clearInterval(interval);
  }, [isGenerating]);

  function addItem(item: TryOnItem) {
    setResult(null);
    setError(null);
    setSelectedIds((current) => {
      const withoutSameSlot = current.filter((id) => {
        const selected = itemById.get(id);
        return selected?.tryOnCategory !== item.tryOnCategory;
      });

      return [...withoutSameSlot, item.id];
    });
  }

  function removeItem(id: string) {
    setSelectedIds((current) => current.filter((selectedId) => selectedId !== id));
  }

  function moveItem(id: string, direction: -1 | 1) {
    setSelectedIds((current) => {
      const index = current.indexOf(id);
      const nextIndex = index + direction;

      if (index < 0 || nextIndex < 0 || nextIndex >= current.length) {
        return current;
      }

      const next = [...current];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];

      return next;
    });
  }

  async function generateTryOn() {
    if (selectedItems.length === 0) {
      setError("Choose at least one closet item.");
      return;
    }

    setIsGenerating(true);
    setLoadingIndex(0);
    setError(null);
    setIsSafetyError(false);
    setShareMessage(null);

    try {
      const response = await fetch("/api/generate-try-on", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemIds: selectedIds, pose, background })
      });
      const payload = (await response.json()) as
        | (GenerationResult & { error?: string; code?: string })
        | { error?: string; code?: string };

      if (!response.ok) {
        if (payload.code === "MISSING_AVATAR_REFERENCE") {
          router.push(
            "/avatar?message=Generate%20your%20reference%20set%20first%20to%20enable%20try-on."
          );
          return;
        }

        setIsSafetyError(payload.code === "PROHIBITED_CONTENT");
        throw new Error(payload.error ?? "Could not generate try-on.");
      }

      setResult(payload as GenerationResult);
    } catch (generationError) {
      setError(
        generationError instanceof Error
          ? generationError.message
          : "Could not generate try-on."
      );
    } finally {
      setIsGenerating(false);
    }
  }

  async function shareResult() {
    if (!result?.imageUrl) {
      return;
    }

    if (navigator.share) {
      await navigator.share({
        title: "Virtual Closet outfit",
        text: "A generated outfit from my Virtual Closet.",
        url: result.imageUrl
      });
      return;
    }

    if (navigator.clipboard) {
      await navigator.clipboard.writeText(result.imageUrl);
      setShareMessage("Share link copied.");
    } else {
      setShareMessage("Copy the image URL from the download button.");
    }
  }

  return (
    <div className="space-y-6">
      {error ? (
        <div className="rounded-xl border border-terracotta/30 bg-terracotta-soft/40 p-4 text-sm leading-6 text-ink">
          <p>
            {isSafetyError
              ? "Sometimes Google's safety filter triggers on try-on. Please regenerate - it usually works on the second attempt."
              : error}
          </p>
          {isSafetyError ? (
            <Button className="mt-3" onClick={generateTryOn} type="button">
              Retry
            </Button>
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(260px,0.95fr)_minmax(300px,0.9fr)_minmax(260px,0.65fr)]">
        <section className="space-y-4 rounded-xl border border-border bg-cream/75 p-4 shadow-soft">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Closet
            </p>
            <h2 className="font-serif text-3xl font-semibold text-ink">
              Choose pieces
            </h2>
          </div>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              className="pl-9"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search closet..."
              value={query}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <FilterButton active={category === "all"} onClick={() => setCategory("all")}>
              All
            </FilterButton>
            {itemCategories
              .filter((itemCategory) => itemCategory.value !== "bag")
              .map((itemCategory) => (
                <FilterButton
                  active={category === itemCategory.value}
                  key={itemCategory.value}
                  onClick={() => setCategory(itemCategory.value as TryOnCategory)}
                >
                  {itemCategory.label}
                </FilterButton>
              ))}
          </div>
          <div className="grid max-h-[660px] gap-3 overflow-y-auto pr-1 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => (
                <button
                  className={cn(
                    "group overflow-hidden rounded-xl border bg-cream text-left shadow-soft transition duration-200 hover:-translate-y-0.5 hover:shadow-lifted",
                    selectedIds.includes(item.id)
                      ? "border-terracotta ring-2 ring-terracotta/25"
                      : "border-border"
                  )}
                  key={item.id}
                  onClick={() => addItem(item)}
                  type="button"
                >
                  <div className="relative aspect-[3/4] bg-parchment">
                    {item.imageSrc ? (
                      <Image
                        alt={item.name}
                        className="object-cover"
                        fill
                        sizes="(min-width: 1536px) 18vw, (min-width: 1280px) 25vw, (min-width: 640px) 50vw, 100vw"
                        src={item.imageSrc}
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                        No image
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="font-serif text-xl font-semibold leading-6 text-ink">
                      {item.name}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {getCategoryLabel(item.category)}
                      {item.color ? ` - ${formatTag(item.color)}` : ""}
                    </p>
                  </div>
                </button>
              ))
            ) : (
              <div className="rounded-xl border border-border bg-parchment/70 p-5 text-sm text-muted-foreground">
                No try-on compatible pieces match this filter.
              </div>
            )}
          </div>
        </section>

        <section className="space-y-4 rounded-xl border border-border bg-cream/75 p-4 shadow-soft">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Outfit
            </p>
            <h2 className="font-serif text-3xl font-semibold text-ink">
              Composition
            </h2>
          </div>
          <div className="space-y-3">
            {slots.map((slot) => {
              const selected = selectedItems.find(
                (item) => item.tryOnCategory === slot.category
              );

              return (
                <div
                  className="grid min-h-24 grid-cols-[4.5rem_1fr_auto] items-center gap-3 rounded-xl border border-border bg-parchment/65 p-3"
                  key={slot.category}
                >
                  <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-cream">
                    {selected?.imageSrc ? (
                      <Image
                        alt={selected.name}
                        className="object-cover"
                        fill
                        sizes="72px"
                        src={selected.imageSrc}
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                        Empty
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      {slot.label}
                    </p>
                    <p className="mt-1 font-serif text-xl font-semibold text-ink">
                      {selected?.name ?? "Add from closet"}
                    </p>
                  </div>
                  {selected ? (
                    <button
                      aria-label={`Remove ${selected.name}`}
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-cream text-muted-foreground transition duration-200 hover:text-ink"
                      onClick={() => removeItem(selected.id)}
                      type="button"
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                  ) : null}
                </div>
              );
            })}
          </div>

          {selectedItems.length > 1 ? (
            <div className="space-y-2 rounded-xl border border-border bg-cream/70 p-3">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Generation order
              </p>
              {selectedItems.map((item, index) => (
                <div className="flex items-center justify-between gap-3" key={item.id}>
                  <span className="text-sm text-ink">{item.name}</span>
                  <div className="flex gap-1">
                    <button
                      aria-label={`Move ${item.name} up`}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground disabled:opacity-30"
                      disabled={index === 0}
                      onClick={() => moveItem(item.id, -1)}
                      type="button"
                    >
                      <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                    <button
                      aria-label={`Move ${item.name} down`}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground disabled:opacity-30"
                      disabled={index === selectedItems.length - 1}
                      onClick={() => moveItem(item.id, 1)}
                      type="button"
                    >
                      <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </section>

        <section className="space-y-4 rounded-xl border border-border bg-cream/75 p-4 shadow-soft">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Direction
            </p>
            <h2 className="font-serif text-3xl font-semibold text-ink">
              Generate
            </h2>
          </div>
          <OptionGroup
            label="Pose"
            options={poses}
            selected={pose}
            onSelect={setPose}
          />
          <OptionGroup
            label="Background"
            options={backgrounds}
            selected={background}
            onSelect={setBackground}
          />
          <Button
            className="w-full"
            disabled={isGenerating || selectedItems.length === 0}
            onClick={generateTryOn}
            type="button"
          >
            <Wand2 className="mr-2 h-4 w-4" aria-hidden="true" />
            Generate image
          </Button>
          {isGenerating ? (
            <div className="rounded-xl border border-terracotta/25 bg-terracotta-soft/30 p-4">
              <div className="mb-3 h-2 overflow-hidden rounded-full bg-cream">
                <div
                  className="h-full rounded-full bg-terracotta transition-all duration-500"
                  style={{
                    width: `${((loadingIndex + 1) / loadingMessages.length) * 100}%`
                  }}
                />
              </div>
              <p className="text-sm text-ink">{loadingMessages[loadingIndex]}</p>
            </div>
          ) : null}
        </section>
      </div>

      {result ? (
        <section className="grid gap-5 rounded-xl border border-border bg-cream/75 p-5 shadow-soft lg:grid-cols-[minmax(0,0.9fr)_minmax(280px,0.45fr)]">
          <div className="relative overflow-hidden rounded-xl bg-parchment">
            {result.imageUrl ? (
              <Image
                alt="Generated try-on result"
                className="h-auto w-full object-cover"
                height={1400}
                src={result.imageUrl}
                width={1000}
              />
            ) : (
              <div className="flex aspect-[4/5] items-center justify-center text-sm text-muted-foreground">
                Generated image saved.
              </div>
            )}
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Result
              </p>
              <h2 className="font-serif text-3xl font-semibold text-ink">
                Look saved
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                This generated image is already saved to your outfit library.
                Estimated cost: ${result.costUsd.toFixed(3)}.
              </p>
            </div>
            <div className="grid gap-2">
              <Button asChild>
                <Link href="/outfits">
                  <Sparkles className="mr-2 h-4 w-4" aria-hidden="true" />
                  Save outfit
                </Link>
              </Button>
              <Button
                onClick={() => {
                  setResult(null);
                  setShareMessage(null);
                }}
                type="button"
                variant="outline"
              >
                Try another pose
              </Button>
              <Button onClick={() => setResult(null)} type="button" variant="outline">
                Edit items
              </Button>
              {result.imageUrl ? (
                <Button asChild variant="outline">
                  <a download href={result.imageUrl}>
                    <Download className="mr-2 h-4 w-4" aria-hidden="true" />
                    Download
                  </a>
                </Button>
              ) : null}
              <Button
                disabled={!result.imageUrl}
                onClick={shareResult}
                type="button"
                variant="outline"
              >
                <Share2 className="mr-2 h-4 w-4" aria-hidden="true" />
                Share
              </Button>
              {shareMessage ? (
                <p className="text-sm text-muted-foreground">{shareMessage}</p>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}

function FilterButton({
  active,
  children,
  onClick
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      className={cn(
        "rounded-full border px-3 py-2 text-sm transition duration-200",
        active
          ? "border-terracotta bg-terracotta text-cream"
          : "border-border bg-card text-muted-foreground hover:text-ink"
      )}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

function OptionGroup({
  label,
  onSelect,
  options,
  selected
}: {
  label: string;
  onSelect: (value: string) => void;
  options: string[];
  selected: string;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <div className="grid gap-2">
        {options.map((option) => (
          <button
            className={cn(
              "rounded-lg border px-3 py-2 text-left text-sm transition duration-200",
              selected === option
                ? "border-terracotta bg-terracotta text-cream"
                : "border-border bg-card text-muted-foreground hover:text-ink"
            )}
            key={option}
            onClick={() => onSelect(option)}
            type="button"
          >
            {formatTag(option)}
          </button>
        ))}
      </div>
    </div>
  );
}
