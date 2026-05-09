# Virtual Closet

Personal wardrobe, avatar, and AI try-on studio for Athena.

## Stack

- Next.js App Router (14+; currently built on Next 16.2.6)
- TypeScript strict mode
- Tailwind CSS + shadcn/ui-style components
- Supabase Auth, Postgres, Storage, and RLS
- Vercel deployment from `master`, with manual promote

## Local Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create `.env.local`:

   ```bash
   cp .env.example .env.local
   ```

   Fill in:

   ```bash
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```

3. Apply the Supabase migration:

   ```bash
   supabase link --project-ref <project-ref>
   supabase db push
   ```

   For local Supabase:

   ```bash
   supabase start
   supabase db reset
   ```

4. Generate Supabase types after migrations are applied:

   ```bash
   supabase gen types typescript --project-id <project-ref> > src/lib/supabase/database.types.ts
   ```

   Or for local Supabase:

   ```bash
   supabase gen types typescript --local > src/lib/supabase/database.types.ts
   ```

5. Run the app:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

| Name | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Recommended | App origin for magic-link redirects. Defaults to `http://localhost:3000`. |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon key for browser/server auth clients. |
| `TRYON_PROVIDER` | Phase 4 | Defaults to `fashn-v16` when try-on generation is implemented. |
| `FASHN_API_KEY` | Phase 4 | Server-only FASHN API key. Never expose to client code. |

## Phase 1 Scope

- Magic-link authentication
- Auto-created profile row on first login
- Settings page for reference photo and measurements
- Supabase tables: `profiles`, `items`, `outfits`, `generations`
- RLS policies for authenticated owner-only access
- Storage buckets: `items`, `avatars`, `generations`
- Sidebar shell: Closet, Avatar, Try-On, Outfits, Calendar, Settings
- Cream/parchment visual system with Cormorant Garamond and Inter

## Database Notes

The migration creates a trigger on `auth.users` so the profile exists as soon as the first magic-link login completes. Defaults:

```json
{
  "display_name": "Athena",
  "height_cm": 169,
  "weight_lbs": 112,
  "measurements": {
    "bust": "33B",
    "waist": 24,
    "hips": 27
  }
}
```

Storage buckets are private. Files should be stored under the authenticated user's UUID folder, for example:

```text
avatars/<user-id>/reference-photo.png
items/<user-id>/<item-id>/processed.png
generations/<user-id>/<generation-id>.png
```

## Provider Decisions

The approved research lives at [docs/tooling-decisions.md](docs/tooling-decisions.md).

Try-on is intentionally behind `TryOnProvider` in `src/lib/providers/try-on/types.ts`, with `fashn-v16` as the first planned provider.
