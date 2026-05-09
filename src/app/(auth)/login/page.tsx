import { Sparkles } from "lucide-react";

import { signInWithGoogle } from "./actions";
import { HashErrorBanner } from "@/components/auth/hash-error-banner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
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
              Sign in with Google to open your private wardrobe studio.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form action={signInWithGoogle}>
            <Button
              className="h-12 w-full gap-3 rounded-xl border border-border bg-white text-ink shadow-soft transition duration-200 ease-out hover:-translate-y-0.5 hover:bg-white hover:shadow-lifted"
              disabled={!isConfigured}
              type="submit"
            >
              <GoogleLogo />
              Continue with Google
            </Button>
          </form>
          {params.message ? (
            <p className="mt-5 rounded-lg border border-border bg-parchment px-3 py-2 text-sm text-muted-foreground">
              {params.message}
            </p>
          ) : null}
          <HashErrorBanner />
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

function GoogleLogo() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M21.6 12.23c0-.79-.07-1.55-.2-2.27H12v4.29h5.37a4.59 4.59 0 0 1-1.99 3.01v2.5h3.22c1.88-1.73 3-4.28 3-7.53Z"
        fill="#4285F4"
      />
      <path
        d="M12 22c2.7 0 4.96-.89 6.61-2.42l-3.22-2.5c-.89.6-2.03.95-3.39.95-2.6 0-4.8-1.76-5.59-4.12H3.08v2.58A9.99 9.99 0 0 0 12 22Z"
        fill="#34A853"
      />
      <path
        d="M6.41 13.91a6 6 0 0 1 0-3.82V7.51H3.08a10.01 10.01 0 0 0 0 8.98l3.33-2.58Z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.97c1.47 0 2.79.51 3.83 1.5l2.86-2.86C16.96 3 14.7 2 12 2a9.99 9.99 0 0 0-8.92 5.51l3.33 2.58C7.2 7.73 9.4 5.97 12 5.97Z"
        fill="#EA4335"
      />
    </svg>
  );
}
