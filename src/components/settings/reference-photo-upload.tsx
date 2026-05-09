"use client";

import { useEffect, useRef, useState } from "react";
import { Camera } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  convertHeicToJpeg,
  isHeicImage
} from "@/lib/image-processing/heic-conversion";

export function ReferencePhotoUpload({
  referencePreviewUrl
}: {
  referencePreviewUrl: string | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const isConvertingRef = useRef(false);
  const [previewUrl, setPreviewUrl] = useState(referencePreviewUrl);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (localPreviewUrl) {
        URL.revokeObjectURL(localPreviewUrl);
      }
    };
  }, [localPreviewUrl]);

  useEffect(() => {
    const form = inputRef.current?.form;

    if (!form) {
      return;
    }

    function handleSubmit(event: SubmitEvent) {
      if (!isConvertingRef.current) {
        return;
      }

      event.preventDefault();
      setError("Finish converting the reference photo before saving.");
    }

    form.addEventListener("submit", handleSubmit);

    return () => form.removeEventListener("submit", handleSubmit);
  }, []);

  async function handleFile(file: File) {
    setError(null);
    setMessage(isHeicImage(file) ? "Converting iPhone photo..." : null);
    isConvertingRef.current = isHeicImage(file);

    try {
      const uploadReadyFile = isHeicImage(file)
        ? await convertHeicToJpeg(file, setMessage)
        : file;

      if (inputRef.current) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(uploadReadyFile);
        inputRef.current.files = dataTransfer.files;
      }

      if (localPreviewUrl) {
        URL.revokeObjectURL(localPreviewUrl);
      }

      const objectUrl = URL.createObjectURL(uploadReadyFile);
      setLocalPreviewUrl(objectUrl);
      setPreviewUrl(objectUrl);
      setMessage(
        isHeicImage(file) ? "Converted to JPEG for upload." : "Photo ready."
      );
    } catch (conversionError) {
      if (inputRef.current) {
        inputRef.current.value = "";
      }

      setPreviewUrl(referencePreviewUrl);
      setMessage(null);
      setError(
        conversionError instanceof Error
          ? `Could not convert this iPhone photo: ${conversionError.message}`
          : "Could not convert this iPhone photo."
      );
    } finally {
      isConvertingRef.current = false;
    }
  }

  return (
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
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Current reference"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center px-8 text-center text-sm leading-6 text-muted-foreground">
              Upload a reference photo. This is used for avatar likeness and AI
              try-on identity.
            </div>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="referencePhoto">Upload photo</Label>
          <Input
            ref={inputRef}
            id="referencePhoto"
            name="referencePhoto"
            type="file"
            accept="image/png,image/jpeg,image/webp,image/heic,image/heif"
            onChange={(event) => {
              const file = event.target.files?.item(0);

              if (file) {
                void handleFile(file);
              }
            }}
          />
        </div>
        {message ? (
          <p className="rounded-lg border border-border bg-parchment px-3 py-2 text-sm text-muted-foreground">
            {message}
          </p>
        ) : null}
        {error ? (
          <p className="rounded-lg border border-border bg-parchment px-3 py-2 text-sm text-muted-foreground">
            {error}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
