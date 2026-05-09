import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { AddItemForm } from "@/components/closet/add-item-form";
import { Button } from "@/components/ui/button";

export default function NewItemPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header className="space-y-4">
        <Button asChild variant="ghost" className="px-0 text-muted-foreground">
          <Link href="/closet">
            <ChevronLeft className="mr-2 h-4 w-4" aria-hidden="true" />
            Back to closet
          </Link>
        </Button>
        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.22em] text-muted-foreground">
            New piece
          </p>
          <h1 className="editorial-heading">Add Item</h1>
        </div>
      </header>
      <AddItemForm />
    </div>
  );
}
