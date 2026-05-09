"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getSiteUrl, hasSupabaseConfig } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export async function signInWithMagicLink(formData: FormData) {
  if (!hasSupabaseConfig()) {
    redirect("/login?message=Add%20your%20Supabase%20environment%20variables%20first.");
  }

  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!email) {
    redirect("/login?message=Enter%20an%20email%20address.");
  }

  const origin = (await headers()).get("origin") ?? getSiteUrl();
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/auth/callback`
    }
  });

  if (error) {
    redirect(`/login?message=${encodeURIComponent(error.message)}`);
  }

  redirect("/login?message=Check%20your%20email%20for%20the%20magic%20link.");
}
