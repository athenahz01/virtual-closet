import { redirect } from "next/navigation";

import { AppSidebar } from "@/components/app-sidebar";
import { hasSupabaseConfig } from "@/lib/env";
import { ensureProfile } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children
}: {
  children: React.ReactNode;
}) {
  if (!hasSupabaseConfig()) {
    redirect("/login");
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  await ensureProfile(supabase, user.id);

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-screen md:grid md:grid-cols-[18rem_1fr]">
      <div className="md:sticky md:top-0 md:h-screen">
        <AppSidebar email={user.email} profile={profile} />
      </div>
      <main className="min-w-0 px-5 py-6 md:px-10 md:py-8">{children}</main>
    </div>
  );
}
