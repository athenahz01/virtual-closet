alter table profiles drop column if exists avatar_asset_url;
alter table profiles drop column if exists avatar_provider;
alter table profiles add column if not exists avatar_reference_paths text[] default null;

comment on column profiles.avatar_reference_paths is
  'Generated reference image storage paths for the user, usually front/back/left/right, used by Gemini try-on.';

comment on column generations.provider is
  'Image generation provider. Going forward, expected value is gemini-nano-banana-pro.';
