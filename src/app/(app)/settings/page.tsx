import { Camera, Ruler } from "lucide-react";
import { redirect } from "next/navigation";

import { updateSettings } from "./actions";
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
import { defaultProfile } from "@/lib/constants";
import { hasSupabaseConfig } from "@/lib/env";
import { getMeasurementValue } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function SettingsPage({
  searchParams
}: {
  searchParams: Promise<{ saved?: string; message?: string }>;
}) {
  const params = await searchParams;

  if (!hasSupabaseConfig()) {
    redirect("/login");
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user?.id ?? "")
    .single();

  let referencePreviewUrl: string | null = null;

  if (profile?.reference_photo_url) {
    const { data } = await supabase.storage
      .from("avatars")
      .createSignedUrl(profile.reference_photo_url, 60 * 60);
    referencePreviewUrl = data?.signedUrl ?? null;
  }

  const bust = getMeasurementValue(profile?.measurements ?? null, "bust");
  const waist = getMeasurementValue(profile?.measurements ?? null, "waist");
  const hips = getMeasurementValue(profile?.measurements ?? null, "hips");

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.22em] text-muted-foreground">
            Private profile
          </p>
          <h1 className="editorial-heading">Settings</h1>
        </div>
        {params.saved ? (
          <p className="rounded-full border border-border bg-parchment px-4 py-2 text-sm text-muted-foreground">
            Profile saved.
          </p>
        ) : null}
      </header>

      {params.message ? (
        <p className="rounded-lg border border-border bg-parchment px-4 py-3 text-sm text-muted-foreground">
          {params.message}
        </p>
      ) : null}

      <form action={updateSettings} className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="overflow-hidden bg-cream/75">
          <CardHeader>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-terracotta-soft text-terracotta">
                <Camera className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <CardTitle>Reference Photo</CardTitle>
                <CardDescription>
                  Used later for avatar likeness and AI try-on identity.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="aspect-[4/5] overflow-hidden rounded-xl border border-border bg-parchment shadow-soft">
              {referencePreviewUrl ? (
                <img
                  src={referencePreviewUrl}
                  alt="Current reference"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center px-8 text-center text-sm leading-6 text-muted-foreground">
                  Upload a reference photo. This is used for avatar likeness
                  and AI try-on identity.
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="referencePhoto">Upload photo</Label>
              <Input
                id="referencePhoto"
                name="referencePhoto"
                type="file"
                accept="image/png,image/jpeg,image/webp"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-cream/75">
          <CardHeader>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-terracotta-soft text-terracotta">
                <Ruler className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <CardTitle>Measurements</CardTitle>
                <CardDescription>
                  These defaults match the initial profile seed.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="displayName">Display name</Label>
              <Input
                id="displayName"
                name="displayName"
                defaultValue={profile?.display_name ?? defaultProfile.displayName}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="heightCm">Height (cm)</Label>
                <Input
                  id="heightCm"
                  name="heightCm"
                  type="number"
                  min="1"
                  defaultValue={profile?.height_cm ?? defaultProfile.heightCm}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weightLbs">Weight (lbs)</Label>
                <Input
                  id="weightLbs"
                  name="weightLbs"
                  type="number"
                  min="1"
                  defaultValue={profile?.weight_lbs ?? defaultProfile.weightLbs}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="bust">Bust</Label>
                <Input id="bust" name="bust" defaultValue={bust} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="waist">Waist</Label>
                <Input
                  id="waist"
                  name="waist"
                  type="number"
                  min="1"
                  defaultValue={waist}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hips">Hips</Label>
                <Input
                  id="hips"
                  name="hips"
                  type="number"
                  min="1"
                  defaultValue={hips}
                />
              </div>
            </div>

            <Button type="submit" className="w-full md:w-auto">
              Save profile
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
