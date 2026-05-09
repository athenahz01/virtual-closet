"use client";

import { useState } from "react";
import { Trash2, X } from "lucide-react";

import { deleteItem } from "@/app/(app)/closet/actions";
import { Button } from "@/components/ui/button";

export function DeleteItemButton({ itemId }: { itemId: string }) {
  const [isConfirming, setIsConfirming] = useState(false);

  if (!isConfirming) {
    return (
      <Button
        type="button"
        variant="outline"
        onClick={() => setIsConfirming(true)}
      >
        <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
        Delete
      </Button>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-parchment p-3 shadow-soft">
      <p className="mb-3 text-sm text-ink">Delete this item permanently?</p>
      <div className="flex flex-wrap gap-2">
        <form action={deleteItem}>
          <input type="hidden" name="itemId" value={itemId} />
          <Button
            type="submit"
            variant="outline"
            className="border-red-300 text-red-700 hover:bg-red-50"
          >
            <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
            Yes, delete
          </Button>
        </form>
        <Button
          type="button"
          variant="ghost"
          onClick={() => setIsConfirming(false)}
        >
          <X className="mr-2 h-4 w-4" aria-hidden="true" />
          Cancel
        </Button>
      </div>
    </div>
  );
}
