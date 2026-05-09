create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text default 'Athena',
  reference_photo_url text,
  avatar_asset_url text,
  avatar_provider text,
  height_cm int default 169,
  weight_lbs int default 112,
  measurements jsonb default '{"bust":"33B","waist":24,"hips":27}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  category text not null,
  subcategory text,
  brand text,
  color text,
  color_hex text,
  season text[],
  occasion text[],
  image_url text not null,
  image_url_processed text,
  notes text,
  times_worn int default 0,
  last_worn_at date,
  created_at timestamptz default now()
);

create table if not exists public.outfits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text,
  item_ids uuid[] not null,
  generated_image_url text,
  pose text,
  notes text,
  is_favorite boolean default false,
  planned_for date,
  worn_at date,
  created_at timestamptz default now()
);

create table if not exists public.generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  outfit_id uuid references public.outfits(id) on delete set null,
  provider text,
  status text,
  cost_usd numeric,
  prompt_payload jsonb,
  result_url text,
  error_message text,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;
alter table public.items enable row level security;
alter table public.outfits enable row level security;
alter table public.generations enable row level security;

create policy "Profiles are viewable by owner"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Profiles are insertable by owner"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Profiles are editable by owner"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Items are viewable by owner"
  on public.items for select
  using (auth.uid() = user_id);

create policy "Items are insertable by owner"
  on public.items for insert
  with check (auth.uid() = user_id);

create policy "Items are editable by owner"
  on public.items for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Items are deletable by owner"
  on public.items for delete
  using (auth.uid() = user_id);

create policy "Outfits are viewable by owner"
  on public.outfits for select
  using (auth.uid() = user_id);

create policy "Outfits are insertable by owner"
  on public.outfits for insert
  with check (auth.uid() = user_id);

create policy "Outfits are editable by owner"
  on public.outfits for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Outfits are deletable by owner"
  on public.outfits for delete
  using (auth.uid() = user_id);

create policy "Generations are viewable by owner"
  on public.generations for select
  using (auth.uid() = user_id);

create policy "Generations are insertable by owner"
  on public.generations for insert
  with check (auth.uid() = user_id);

create policy "Generations are editable by owner"
  on public.generations for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Generations are deletable by owner"
  on public.generations for delete
  using (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    display_name,
    height_cm,
    weight_lbs,
    measurements
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', 'Athena'),
    169,
    112,
    '{"bust":"33B","waist":24,"hips":27}'::jsonb
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('items', 'items', false, 10485760, array['image/jpeg', 'image/png', 'image/webp']),
  ('avatars', 'avatars', false, 52428800, array['image/jpeg', 'image/png', 'image/webp', 'model/gltf-binary', 'application/octet-stream']),
  ('generations', 'generations', false, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Users can read own item assets"
  on storage.objects for select
  using (bucket_id = 'items' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can upload own item assets"
  on storage.objects for insert
  with check (bucket_id = 'items' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can update own item assets"
  on storage.objects for update
  using (bucket_id = 'items' and auth.uid()::text = (storage.foldername(name))[1])
  with check (bucket_id = 'items' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can delete own item assets"
  on storage.objects for delete
  using (bucket_id = 'items' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can read own avatar assets"
  on storage.objects for select
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can upload own avatar assets"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can update own avatar assets"
  on storage.objects for update
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1])
  with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can delete own avatar assets"
  on storage.objects for delete
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can read own generation assets"
  on storage.objects for select
  using (bucket_id = 'generations' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can upload own generation assets"
  on storage.objects for insert
  with check (bucket_id = 'generations' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can update own generation assets"
  on storage.objects for update
  using (bucket_id = 'generations' and auth.uid()::text = (storage.foldername(name))[1])
  with check (bucket_id = 'generations' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can delete own generation assets"
  on storage.objects for delete
  using (bucket_id = 'generations' and auth.uid()::text = (storage.foldername(name))[1]);
