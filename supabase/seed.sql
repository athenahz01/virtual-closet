-- Optional local seed helper.
-- Profiles are created automatically by the auth.users trigger in the migration.
-- After creating a local Supabase user, this query can reset the current user's
-- profile defaults while authenticated in SQL editor/test tooling.
update public.profiles
set
  display_name = 'Athena',
  height_cm = 169,
  weight_lbs = 112,
  measurements = '{"bust":"33B","waist":24,"hips":27}'::jsonb
where id = auth.uid();
