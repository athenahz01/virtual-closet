import { Sparkles } from "lucide-react";

import { signInWithMagicLink } from "./actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { hasSupabaseConfig } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const params = await searchParams;
  const isConfigured = hasSupabaseConfig();

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <Card className="w-full max-w-md bg-cream/80 backdrop-blur">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-terracotta-soft text-terracotta">
            <Sparkles className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <CardTitle className="font-serif text-4xl">Virtual Closet</CardTitle>
            <CardDescription>
              Sign in with a magic link to open your private wardrobe studio.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form action={signInWithMagicLink} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="athena@example.com"
                required
              />
            </div>
            <Button className="w-full" disabled={!isConfigured}>
              Send magic link
            </Button>
          </form>
          {params.message ? (
            <p className="mt-5 rounded-lg border border-border bg-parchment px-3 py-2 text-sm text-muted-foreground">
              {params.message}
            </p>
          ) : null}
          {!isConfigured ? (
            <p className="mt-5 rounded-lg border border-border bg-parchment px-3 py-2 text-sm text-muted-foreground">
              Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
              to `.env.local` before signing in.
            </p>
          ) : null}
        </CardContent>
      </Card>
    </main>
  );
}
