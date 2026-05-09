import { updateItem } from "@/app/(app)/closet/actions";
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
  itemCategories,
  occasionOptions,
  seasonOptions
} from "@/lib/constants";
import { formatTag, type ItemRow } from "@/lib/wardrobe";

export function ItemEditForm({ item }: { item: ItemRow }) {
  return (
    <form action={updateItem}>
      <input type="hidden" name="itemId" value={item.id} />
      <Card className="bg-cream/75">
        <CardHeader>
          <CardTitle>Edit Item</CardTitle>
          <CardDescription>
            Update the item metadata used throughout the closet.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" defaultValue={item.name} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="brand">Brand</Label>
              <Input id="brand" name="brand" defaultValue={item.brand ?? ""} />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                name="category"
                defaultValue={item.category}
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
              <Input
                id="subcategory"
                name="subcategory"
                defaultValue={item.subcategory ?? ""}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-[1fr_auto]">
            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <Input id="color" name="color" defaultValue={item.color ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="colorHex">Swatch</Label>
              <Input
                id="colorHex"
                name="colorHex"
                type="color"
                defaultValue={item.color_hex ?? "#EFE8DA"}
                className="h-11 w-20 p-1"
              />
            </div>
          </div>

          <CheckboxGroup
            label="Season"
            name="season"
            values={seasonOptions}
            selected={item.season ?? []}
          />
          <CheckboxGroup
            label="Occasion"
            name="occasion"
            values={occasionOptions}
            selected={item.occasion ?? []}
          />

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" defaultValue={item.notes ?? ""} />
          </div>

          <Button type="submit">Save changes</Button>
        </CardContent>
      </Card>
    </form>
  );
}

function CheckboxGroup({
  label,
  name,
  selected,
  values
}: {
  label: string;
  name: string;
  selected: string[];
  values: readonly string[];
}) {
  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium text-ink">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {values.map((value) => (
          <label
            key={value}
            className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-border bg-parchment px-3 py-2 text-sm text-muted-foreground transition duration-200 hover:text-ink"
          >
            <input
              type="checkbox"
              name={name}
              value={value}
              defaultChecked={selected.includes(value)}
              className="h-3.5 w-3.5 accent-terracotta"
            />
            {formatTag(value)}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
