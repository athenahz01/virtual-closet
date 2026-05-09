import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";

export function PhasePlaceholder({
  title,
  description,
  nextLabel = "Open settings",
  nextHref = "/settings"
}: {
  title: string;
  description: string;
  nextLabel?: string;
  nextHref?: string;
}) {
  return (
    <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl items-center">
      <Card className="w-full overflow-hidden bg-cream/70">
        <CardHeader className="max-w-2xl space-y-3 p-8 md:p-10">
          <CardTitle className="editorial-heading">{title}</CardTitle>
          <CardDescription className="text-base leading-7">
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6 p-8 pt-0 md:flex-row md:items-center md:justify-between md:p-10 md:pt-0">
          <div className="grid grid-cols-3 gap-3">
            <span className="h-28 rounded-xl bg-parchment shadow-soft" />
            <span className="h-28 rounded-xl bg-terracotta-soft shadow-soft" />
            <span className="h-28 rounded-xl bg-cream shadow-soft" />
          </div>
          <Button asChild>
            <Link href={nextHref}>
              {nextLabel}
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}
