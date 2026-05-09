"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2, Sparkles, Upload } from "lucide-react";

import { createItem } from "@/app/(app)/closet/actions";
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
import { Textarea } from "@/components/ui/textarea";
import {
  colorOptions,
  itemCategories,
  occasionOptions,
  seasonOptions
} from "@/lib/constants";
import { removeGarmentBackground } from "@/lib/image-processing/background-removal";
import { cn } from "@/lib/utils";

export function AddItemForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [processedFile, setProcessedFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPending, startTransition] = useTransition();

  const originalPreview = useObjectUrl(originalFile);
  const processedPreview = useObjectUrl(processedFile);

  async function handleFile(file: File) {
    setOriginalFile(file);
    setProcessedFile(null);
    setIsProcessing(true);
    setMessage("Removing background in your browser...");

    try {
      const processed = await removeGarmentBackground(file, setMessage);
      setProcessedFile(processed);
      setMessage("Cutout ready.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? `Cutout failed: ${error.message}. You can still save the original.`
          : "Cutout failed. You can still save the original."
      );
    } finally {
      setIsProcessing(false);
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!formRef.current) {
      return;
    }

    const formData = new FormData(formRef.current);

    if (processedFile) {
      formData.set("processedPhoto", processedFile);
    }

    startTransition(async () => {
      const result = await createItem(formData);

      if (!result.ok) {
        setMessage(result.error);
        return;
      }

      router.push(`/closet/${result.itemId}`);
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <Card className="overflow-hidden bg-cream/75">
        <CardHeader>
          <CardTitle>Add Clothing Photo</CardTitle>
          <CardDescription>
            The cutout runs locally in your browser before anything is uploaded.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              const file = event.dataTransfer.files.item(0);
              if (file) {
                void handleFile(file);
              }
            }}
            className={cn(
              "flex min-h-80 w-full flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed border-border bg-parchment/70 text-center shadow-soft transition duration-200 hover:-translate-y-0.5 hover:shadow-lifted",
              originalPreview ? "p-0" : "p-8"
            )}
          >
            {originalPreview ? (
              <img
                src={processedPreview ?? originalPreview}
                alt="Selected garment preview"
                className="max-h-[32rem] w-full object-contain"
              />
            ) : (
              <>
                <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-terracotta-soft text-terracotta">
                  <ImagePlus className="h-6 w-6" aria-hidden="true" />
                </span>
                <span className="font-serif text-2xl font-semibold text-ink">
                  Drop a garment photo
                </span>
                <span className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
                  Flat-lay, hanger, or mirror photos all work. Keep the item
                  visible and well lit.
                </span>
              </>
            )}
          </button>
          <Input
            ref={fileInputRef}
            className="hidden"
            name="originalPhoto"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            required
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                void handleFile(file);
              }
            }}
          />
          {message ? (
            <p className="flex items-center gap-2 rounded-lg border border-border bg-parchment px-3 py-2 text-sm text-muted-foreground">
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Sparkles className="h-4 w-4" aria-hidden="true" />
              )}
              {message}
            </p>
          ) : null}
          {processedPreview && originalPreview ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <PreviewTile label="Original" src={originalPreview} />
              <PreviewTile label="Cutout" src={processedPreview} />
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="bg-cream/75">
        <CardHeader>
          <CardTitle>Item Details</CardTitle>
          <CardDescription>
            Add enough metadata to make filtering useful later.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <ItemFields />
          <Button type="submit" disabled={isPending || isProcessing} className="w-full md:w-auto">
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Upload className="mr-2 h-4 w-4" aria-hidden="true" />
            )}
            Save item
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}

function ItemFields() {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" placeholder="Silk camisole" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="brand">Brand</Label>
          <Input id="brand" name="brand" placeholder="Aritzia" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <select
            id="category"
            name="category"
            required
            className="h-11 w-full rounded-lg border border-input bg-card px-3 text-sm shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {itemCategories.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="subcategory">Subcategory</Label>
          <Input id="subcategory" name="subcategory" placeholder="Tank, mini, boot..." />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_auto]">
        <div className="space-y-2">
          <Label htmlFor="color">Color</Label>
          <Input id="color" name="color" placeholder="Ivory" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="colorHex">Swatch</Label>
          <Input
            id="colorHex"
            name="colorHex"
            type="color"
            defaultValue={colorOptions[2].hex}
            className="h-11 w-20 p-1"
          />
        </div>
      </div>

      <CheckboxGroup label="Season" name="season" values={seasonOptions} />
      <CheckboxGroup label="Occasion" name="occasion" values={occasionOptions} />

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" placeholder="Fit, styling ideas, fabric care..." />
      </div>
    </>
  );
}

function CheckboxGroup({
  label,
  name,
  values
}: {
  label: string;
  name: string;
  values: readonly string[];
}) {
  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium text-ink">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {values.map((value) => (
          <label
            key={value}
            className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-border bg-parchment px-3 py-2 text-sm capitalize text-muted-foreground transition duration-200 hover:text-ink"
          >
            <input
              type="checkbox"
              name={name}
              value={value}
              className="h-3.5 w-3.5 accent-terracotta"
            />
            {value}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function PreviewTile({ label, src }: { label: string; src: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-parchment shadow-soft">
      <div className="border-b border-border px-3 py-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </div>
      <img src={src} alt={`${label} preview`} className="h-52 w-full object-contain" />
    </div>
  );
}

function useObjectUrl(file: File | null) {
  const url = useMemo(() => {
    if (!file) {
      return null;
    }

    return URL.createObjectURL(file);
  }, [file]);

  useEffect(() => {
    return () => {
      if (url) {
        URL.revokeObjectURL(url);
      }
    };
  }, [url]);

  return url;
}
