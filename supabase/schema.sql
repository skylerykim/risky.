-- ============================================================
--  risky · Supabase setup
--  Paste this whole file into the Supabase SQL Editor and Run.
--  Safe to run more than once.
-- ============================================================

-- ---------- Tables ----------

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  lat double precision,
  lng double precision,
  location_updated_at timestamptz
);

create table if not exists public.adventures (
  id uuid primary key default gen_random_uuid(),
  author uuid not null references auth.users(id) on delete cascade,
  title text not null,
  note text,
  lat double precision not null,
  lng double precision not null,
  happened_on date,
  created_at timestamptz not null default now()
);

create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  adventure_id uuid not null references public.adventures(id) on delete cascade,
  storage_path text not null,
  filters jsonb not null default '{}'::jsonb,
  sort int not null default 0,
  created_at timestamptz not null default now()
);

-- ---------- Row Level Security ----------
-- This is a private app for two people, so any signed-in user can see and
-- edit everything (a shared space). Keep sign-ups closed (see README) so only
-- the two of you ever have accounts.

alter table public.profiles enable row level security;
alter table public.adventures enable row level security;
alter table public.photos enable row level security;

drop policy if exists "shared read profiles" on public.profiles;
create policy "shared read profiles" on public.profiles
  for select to authenticated using (true);

drop policy if exists "own profile upsert" on public.profiles;
create policy "own profile upsert" on public.profiles
  for insert to authenticated with check (auth.uid() = id);

-- Either person can update either profile (shared 2-person space). This also
-- lets "Break pair" clear the partner's profile so both unpair at once.
drop policy if exists "own profile update" on public.profiles;
drop policy if exists "shared profile update" on public.profiles;
create policy "shared profile update" on public.profiles
  for update to authenticated using (true) with check (true);

drop policy if exists "shared adventures" on public.adventures;
create policy "shared adventures" on public.adventures
  for all to authenticated using (true) with check (true);

drop policy if exists "shared photos" on public.photos;
create policy "shared photos" on public.photos
  for all to authenticated using (true) with check (true);

-- ---------- A song attached to a patch of memories ----------

create table if not exists public.patch_songs (
  anchor text primary key,
  track jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.patch_songs enable row level security;
drop policy if exists "shared patch songs" on public.patch_songs;
create policy "shared patch songs" on public.patch_songs
  for all to authenticated using (true) with check (true);

-- ---------- Storage bucket for photos (private) ----------

insert into storage.buckets (id, name, public)
values ('photos', 'photos', false)
on conflict (id) do nothing;

drop policy if exists "shared photos read" on storage.objects;
create policy "shared photos read" on storage.objects
  for select to authenticated using (bucket_id = 'photos');

drop policy if exists "shared photos write" on storage.objects;
create policy "shared photos write" on storage.objects
  for insert to authenticated with check (bucket_id = 'photos');

drop policy if exists "shared photos delete" on storage.objects;
create policy "shared photos delete" on storage.objects
  for delete to authenticated using (bucket_id = 'photos');

-- ---------- Realtime (live distance + new memories) ----------

do $$
begin
  alter publication supabase_realtime add table public.profiles;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.adventures;
exception when duplicate_object then null;
end $$;
