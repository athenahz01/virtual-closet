"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { itemCategories, seasonOptions } from "@/lib/constants";
import { cn } from "@/lib/utils";
import {
  formatTag,
  getCategoryLabel,
  type ClosetItemView
} from "@/lib/wardrobe";

type SortMode = "newest" | "most-worn" | "least-worn" | "az";

export function ClosetGrid({
  items
}: {
  items: ClosetItemView[];
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [season, setSeason] = useState("all");
  const [colorHex, setColorHex] = useState("all");
  const [sort, setSort] = useState<SortMode>("newest");

  const availableColors = useMemo(() => {
    const seen = new Map<string, { name: string; hex: string }>();

    items.forEach((item) => {
      if (item.color_hex) {
        seen.set(item.color_hex, {
          name: item.color ?? item.color_hex,
          hex: item.color_hex
        });
      }
    });

    return Array.from(seen.values());
  }, [items]);

  const filteredItems = useMemo(() => {
    const lowerQuery = query.trim().toLowerCase();

    return items
      .filter((item) => {
        if (category !== "all" && item.category !== category) {
          return false;
        }

        if (season !== "all" && !item.season?.includes(season)) {
          return false;
        }

        if (colorHex !== "all" && item.color_hex !== colorHex) {
          return false;
        }

        if (!lowerQuery) {
          return true;
        }

        return [
          item.name,
          item.brand,
          item.subcategory,
          item.color,
          item.notes
        ]
          .filter(Boolean)
          .some((value) => value?.toLowerCase().includes(lowerQuery));
      })
      .sort((a, b) => {
        if (sort === "az") {
          return a.name.localeCompare(b.name);
        }

        if (sort === "most-worn") {
          return (b.times_worn ?? 0) - (a.times_worn ?? 0);
        }

        if (sort === "least-worn") {
          return (a.times_worn ?? 0) - (b.times_worn ?? 0);
        }

        return (
          new Date(b.created_at ?? 0).getTime() -
          new Date(a.created_at ?? 0).getTime()
        );
      });
  }, [category, colorHex, items, query, season, sort]);

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.22em] text-muted-foreground">
            Digital wardrobe
          </p>
          <h1 className="editorial-heading">Closet</h1>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button asChild>
            <Link href="/closet/new">
              <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
              Add item
            </Link>
          </Button>
        </div>
      </header>

      <section className="space-y-5 rounded-xl border border-border bg-cream/70 p-4 shadow-soft md:p-5">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search name, brand, color, notes..."
              className="pl-9"
            />
          </div>
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as SortMode)}
            className="h-11 rounded-lg border border-input bg-card px-3 text-sm shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="newest">Newest</option>
            <option value="most-worn">Most worn</option>
            <option value="least-worn">Least worn</option>
            <option value="az">A-Z</option>
          </select>
        </div>

        <div className="flex flex-wrap gap-2">
          <FilterButton active={category === "all"} onClick={() => setCategory("all")}>
            All
          </FilterButton>
          {itemCategories.map((itemCategory) => (
            <FilterButton
              active={category === itemCategory.value}
              key={itemCategory.value}
              onClick={() => setCategory(itemCategory.value)}
            >
              {itemCategory.label}
            </FilterButton>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <FilterButton active={season === "all"} onClick={() => setSeason("all")}>
            All seasons
          </FilterButton>
          {seasonOptions.map((option) => (
            <FilterButton
              active={season === option}
              key={option}
              onClick={() => setSeason(option)}
            >
              {formatTag(option)}
            </FilterButton>
          ))}
        </div>

        {availableColors.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setColorHex("all")}
              className={cn(
                "h-8 rounded-full border px-3 text-xs text-muted-foreground transition duration-200",
                colorHex === "all"
                  ? "border-terracotta bg-terracotta text-cream"
                  : "border-border bg-card hover:text-ink"
              )}
            >
              All colors
            </button>
            {availableColors.map((color) => (
              <button
                aria-label={`Filter ${color.name}`}
                className={cn(
                  "h-8 w-8 rounded-full border shadow-soft transition duration-200 hover:-translate-y-0.5",
                  colorHex === color.hex ? "border-ink ring-2 ring-terracotta" : "border-border"
                )}
                key={color.hex}
                onClick={() => setColorHex(color.hex)}
                style={{ backgroundColor: color.hex }}
                title={color.name}
                type="button"
              />
            ))}
          </div>
        ) : null}
      </section>

      {filteredItems.length > 0 ? (
        <div className="columns-1 gap-5 sm:columns-2 lg:columns-3 2xl:columns-4">
          {filteredItems.map((item) => (
            <Link
              href={`/closet/${item.id}`}
              key={item.id}
              className="mb-5 block break-inside-avoid overflow-hidden rounded-xl border border-border bg-cream shadow-soft transition duration-200 hover:-translate-y-1 hover:shadow-lifted"
            >
              <div className="relative bg-parchment">
                {item.imageSrc ? (
                  <Image
                    src={item.imageSrc}
                    alt={item.name}
                    width={640}
                    height={840}
                    className="h-auto w-full object-cover"
                    sizes="(min-width: 1536px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  />
                ) : (
                  <div className="flex aspect-[3/4] items-center justify-center text-sm text-muted-foreground">
                    No image
                  </div>
                )}
              </div>
              <div className="space-y-2 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-serif text-2xl font-semibold leading-6 text-ink">
                      {item.name}
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {getCategoryLabel(item.category)}
                      {item.brand ? ` - ${item.brand}` : ""}
                    </p>
                  </div>
                  {item.color_hex ? (
                    <span
                      aria-label={item.color ?? "Item color"}
                      className="mt-1 h-5 w-5 shrink-0 rounded-full border border-border"
                      style={{ backgroundColor: item.color_hex }}
                    />
                  ) : null}
                </div>
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Worn {item.times_worn ?? 0} times
                </p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyCloset hasItems={items.length > 0} />
      )}
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
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-2 text-sm transition duration-200",
        active
          ? "border-terracotta bg-terracotta text-cream"
          : "border-border bg-card text-muted-foreground hover:text-ink"
      )}
    >
      {children}
    </button>
  );
}

function EmptyCloset({ hasItems }: { hasItems: boolean }) {
  return (
    <div className="flex min-h-96 flex-col items-center justify-center rounded-xl border border-border bg-cream/70 px-6 text-center shadow-soft">
      <p className="font-serif text-3xl font-semibold text-ink">
        {hasItems ? "No pieces match those filters." : "Your closet is ready."}
      </p>
      <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
        {hasItems
          ? "Clear a filter or try a broader search."
          : "Add your first clothing photo to start building the wardrobe grid."}
      </p>
      <Button asChild className="mt-6">
        <Link href="/closet/new">
          <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
          Add item
        </Link>
      </Button>
    </div>
  );
}
