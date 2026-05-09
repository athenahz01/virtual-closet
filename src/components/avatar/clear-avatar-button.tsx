"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";

import { clearAvatar } from "@/app/(app)/avatar/actions";
import { Button } from "@/components/ui/button";

export function ClearAvatarButton() {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <Button variant="outline" type="button" onClick={() => setConfirming(true)}>
        <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
        Clear avatar
      </Button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-parchment p-2 shadow-soft">
      <span className="px-2 text-sm text-muted-foreground">Clear avatar?</span>
      <form action={clearAvatar}>
        <Button size="sm" type="submit">
          Yes
        </Button>
      </form>
      <Button size="sm" variant="outline" type="button" onClick={() => setConfirming(false)}>
        Cancel
      </Button>
    </div>
  );
}
