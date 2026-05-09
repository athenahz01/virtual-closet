"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getSiteUrl, hasSupabaseConfig } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export async function signInWithGoogle() {
  if (!hasSupabaseConfig()) {
    redirect("/login?message=Add%20your%20Supabase%20environment%20variables%20first.");
  }

  const origin = (await headers()).get("origin") ?? getSiteUrl();
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback`,
      queryParams: {
        access_type: "offline",
        prompt: "consent"
      }
    }
  });

  if (error) {
    redirect(`/login?message=${encodeURIComponent(error.message)}`);
  }

  if (data?.url) {
    redirect(data.url);
  }

  redirect("/login?message=Could%20not%20start%20Google%20sign-in.");
}
