import Link from "next/link";
import {
  CalendarDays,
  GalleryVerticalEnd,
  Image,
  Settings,
  Shirt,
  Sparkles,
  UserRound
} from "lucide-react";

import { signOut } from "@/app/(app)/actions";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { navigationItems } from "@/lib/constants";
import type { Profile } from "@/lib/profile";

const icons = {
  Closet: Shirt,
  Avatar: UserRound,
  "Try-On": Sparkles,
  Outfits: GalleryVerticalEnd,
  Calendar: CalendarDays,
  Settings: Settings
};

export function AppSidebar({
  email,
  profile
}: {
  email: string | undefined;
  profile: Profile | null;
}) {
  return (
    <aside className="flex h-full w-full flex-col border-r border-border bg-cream/75 px-4 py-5 backdrop-blur md:w-72">
      <Link href="/closet" className="group flex items-center gap-3 px-2">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-ink text-cream shadow-soft transition duration-200 group-hover:-translate-y-0.5">
          <Image className="h-5 w-5" aria-hidden="true" />
        </span>
        <span>
          <span className="block font-serif text-2xl font-semibold leading-6 text-ink">
            Closet
          </span>
          <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Athena Studio
          </span>
        </span>
      </Link>

      <Separator className="my-5" />

      <nav className="space-y-1">
        {navigationItems.map((item) => {
          const Icon = icons[item.label];

          return (
            <Button
              asChild
              key={item.href}
              variant="ghost"
              className="w-full justify-start gap-3 px-3 text-muted-foreground hover:text-ink"
            >
              <Link href={item.href}>
                <Icon className="h-4 w-4" aria-hidden="true" />
                {item.label}
              </Link>
            </Button>
          );
        })}
      </nav>

      <div className="mt-auto space-y-4 rounded-xl border border-border bg-parchment/70 p-4 shadow-soft">
        <div>
          <p className="font-serif text-xl font-semibold text-ink">
            {profile?.display_name ?? "Athena"}
          </p>
          <p className="break-all text-xs text-muted-foreground">{email}</p>
        </div>
        <form action={signOut}>
          <Button type="submit" variant="outline" className="w-full">
            Sign out
          </Button>
        </form>
      </div>
    </aside>
  );
}
