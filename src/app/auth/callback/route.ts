import { NextResponse } from "next/server";

import { hasSupabaseConfig } from "@/lib/env";
import { ensureProfile } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/settings";

  if (!hasSupabaseConfig()) {
    return NextResponse.redirect(new URL("/login", requestUrl.origin));
  }

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (user) {
      await ensureProfile(supabase, user.id);
    }
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
