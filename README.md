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
| `NEXT_PUBLIC_SITE_URL` | Recommended | App origin for auth redirects. Defaults to `http://localhost:3000`. |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon key for browser/server auth clients. |
| `NEXT_PUBLIC_READY_PLAYER_ME_SUBDOMAIN` | Optional | Ready Player Me iframe subdomain. Defaults to `demo` for local testing. |
| `TRYON_PROVIDER` | Phase 4 | Defaults to `fashn-v16` when try-on generation is implemented. |
| `FASHN_API_KEY` | Phase 4 | Server-only FASHN API key. Never expose to client code. |

## Google OAuth Setup

1. Create OAuth credentials in the [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
2. Add this authorized redirect URI:

   ```text
   https://<project-ref>.supabase.co/auth/v1/callback
   ```

3. In Supabase, go to Auth -> Providers, enable Google, and paste the Google Client ID and Client Secret.
4. In Supabase, go to Auth -> URL Configuration and set the Site URL plus any local/production Redirect URLs, such as:

   ```text
   http://localhost:3000/auth/callback
   http://localhost:3001/auth/callback
   https://your-vercel-domain.vercel.app/auth/callback
   ```

## Phase 1 Scope

- Google OAuth authentication
- Auto-created profile row on first login
- Settings page for reference photo and measurements
- Supabase tables: `profiles`, `items`, `outfits`, `generations`
- RLS policies for authenticated owner-only access
- Storage buckets: `items`, `avatars`, `generations`
- Sidebar shell: Closet, Avatar, Try-On, Outfits, Calendar, Settings
- Cream/parchment visual system with Cormorant Garamond and Inter

## Phase 2 Scope

- Add item flow with drag/drop image selection
- Browser-side `@imgly/background-removal` Web Worker cutouts
- Original and processed garment image uploads to Supabase Storage
- Closet masonry grid with category, season, color, search, and sort controls
- Item detail pages with metadata, wear stats, and related outfits
- Metadata edit and item delete actions

## Phase 3 Scope

- Ready Player Me avatar creator embedded in `/avatar`
- Profile-level avatar URL storage with provider metadata
- React Three Fiber + drei GLB viewer with orbit controls and idle movement
- Decorative avatar widget in the Closet header

## Database Notes

The migration creates a trigger on `auth.users` so the profile exists as soon as the first Google OAuth login completes. Defaults:

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

Private local reference images can live under `private/`; that folder is ignored and should not be committed.
