import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft, Pencil } from "lucide-react";

import { DeleteItemButton } from "@/components/closet/delete-item-button";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { hasSupabaseConfig } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import {
  createSignedImageUrl,
  formatTag,
  getCategoryLabel,
  getPreferredImagePath
} from "@/lib/wardrobe";

export const dynamic = "force-dynamic";

export default async function ItemDetailPage({
  params
}: {
  params: Promise<{ itemId: string }>;
}) {
  if (!hasSupabaseConfig()) {
    redirect("/login");
  }

  const { itemId } = await params;
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: item } = await supabase
    .from("items")
    .select("*")
    .eq("id", itemId)
    .eq("user_id", user.id)
    .single();

  if (!item) {
    notFound();
  }

  const imageSrc = await createSignedImageUrl(
    supabase.storage,
    "items",
    getPreferredImagePath(item)
  );

  const { data: outfits } = await supabase
    .from("outfits")
    .select("*")
    .eq("user_id", user.id)
    .contains("item_ids", [item.id])
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-4">
          <Button asChild variant="ghost" className="px-0 text-muted-foreground">
            <Link href="/closet">
              <ChevronLeft className="mr-2 h-4 w-4" aria-hidden="true" />
              Back to closet
            </Link>
          </Button>
          <div>
            <p className="mb-2 text-xs uppercase tracking-[0.22em] text-muted-foreground">
              {getCategoryLabel(item.category)}
            </p>
            <h1 className="editorial-heading">{item.name}</h1>
          </div>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/closet/${item.id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" aria-hidden="true" />
              Edit
            </Link>
          </Button>
          <DeleteItemButton itemId={item.id} />
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_24rem]">
        <Card className="overflow-hidden bg-cream/75">
          <div className="relative min-h-[34rem] bg-parchment">
            {imageSrc ? (
              <Image
                src={imageSrc}
                alt={item.name}
                fill
                className="object-contain"
                sizes="(min-width: 1024px) 65vw, 100vw"
                priority
              />
            ) : (
              <div className="flex h-full min-h-[34rem] items-center justify-center text-muted-foreground">
                No image
              </div>
            )}
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="bg-cream/75">
            <CardHeader>
              <CardTitle>Details</CardTitle>
              <CardDescription>Metadata for filtering and styling.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <DetailRow label="Brand" value={item.brand} />
              <DetailRow label="Subcategory" value={item.subcategory} />
              <DetailRow label="Color" value={item.color} swatch={item.color_hex} />
              <DetailRow label="Season" value={item.season?.map(formatTag).join(", ")} />
              <DetailRow label="Occasion" value={item.occasion?.map(formatTag).join(", ")} />
              <DetailRow label="Notes" value={item.notes} />
            </CardContent>
          </Card>

          <Card className="bg-cream/75">
            <CardHeader>
              <CardTitle>Wear Stats</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <Stat label="Times worn" value={String(item.times_worn ?? 0)} />
              <Stat label="Last worn" value={item.last_worn_at ?? "Not yet"} />
            </CardContent>
          </Card>

          <Card className="bg-cream/75">
            <CardHeader>
              <CardTitle>Outfits</CardTitle>
              <CardDescription>Looks that use this item.</CardDescription>
            </CardHeader>
            <CardContent>
              {outfits && outfits.length > 0 ? (
                <div className="space-y-2">
                  {outfits.map((outfit) => (
                    <Link
                      href="/outfits"
                      key={outfit.id}
                      className="block rounded-lg border border-border bg-parchment px-3 py-2 text-sm text-ink transition duration-200 hover:-translate-y-0.5 hover:shadow-soft"
                    >
                      {outfit.name ?? "Untitled outfit"}
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm leading-6 text-muted-foreground">
                  No saved outfits use this piece yet.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function DetailRow({
  label,
  swatch,
  value
}: {
  label: string;
  swatch?: string | null;
  value?: string | null;
}) {
  return (
    <div className="border-b border-border pb-3 last:border-0 last:pb-0">
      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 flex items-center gap-2 text-ink">
        {swatch ? (
          <span
            className="h-4 w-4 rounded-full border border-border"
            style={{ backgroundColor: swatch }}
          />
        ) : null}
        {value || "-"}
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-parchment p-4">
      <p className="font-serif text-3xl font-semibold text-ink">{value}</p>
      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
    </div>
  );
}
