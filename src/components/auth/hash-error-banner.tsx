"use client";

import { useEffect, useState } from "react";

export function HashErrorBanner() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!window.location.hash) {
      return;
    }

    const params = new URLSearchParams(window.location.hash.slice(1));
    const errorDescription = params.get("error_description");

    if (errorDescription) {
      setMessage(errorDescription);
      window.history.replaceState(
        null,
        "",
        window.location.pathname + window.location.search
      );
    }
  }, []);

  if (!message) {
    return null;
  }

  return (
    <p className="mt-5 rounded-lg border border-border bg-parchment px-3 py-2 text-sm text-muted-foreground">
      {message}
    </p>
  );
}
