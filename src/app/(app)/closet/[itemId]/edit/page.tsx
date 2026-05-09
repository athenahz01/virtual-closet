import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { ItemEditForm } from "@/components/closet/item-edit-form";
import { Button } from "@/components/ui/button";
import { hasSupabaseConfig } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function EditItemPage({
  params,
  searchParams
}: {
  params: Promise<{ itemId: string }>;
  searchParams: Promise<{ message?: string }>;
}) {
  if (!hasSupabaseConfig()) {
    redirect("/login");
  }

  const [{ itemId }, paramsValue] = await Promise.all([params, searchParams]);
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

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <header className="space-y-4">
        <Button asChild variant="ghost" className="px-0 text-muted-foreground">
          <Link href={`/closet/${item.id}`}>
            <ChevronLeft className="mr-2 h-4 w-4" aria-hidden="true" />
            Back to item
          </Link>
        </Button>
        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.22em] text-muted-foreground">
            Closet metadata
          </p>
          <h1 className="editorial-heading">Edit {item.name}</h1>
        </div>
      </header>
      {paramsValue.message ? (
        <p className="rounded-lg border border-border bg-parchment px-4 py-3 text-sm text-muted-foreground">
          {paramsValue.message}
        </p>
      ) : null}
      <ItemEditForm item={item} />
    </div>
  );
}
