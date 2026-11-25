-- ============================================================================
-- AutoGaráž — Elektronická servisní knížka & evidence nákladů vozidel
-- Kompletní Supabase PostgreSQL schéma, RLS politiky a Storage bucket
-- ============================================================================

-- 1. Rozšíření
create extension if not exists "pgcrypto";

-- 2. Pomocná funkce pro automatickou aktualizaci `updated_at`
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

-- ============================================================================
-- TABULKA: vehicles (Garáž — vozidla uživatele)
-- ============================================================================
create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,

  -- Základní údaje
  nickname text not null,
  make text not null,
  model text not null,
  year integer not null check (year >= 1900 and year <= 2100),
  license_plate text,
  initial_mileage integer not null default 0 check (initial_mileage >= 0),
  current_mileage integer not null default 0 check (current_mileage >= 0),
  cover_photo_path text,

  -- Technické specifikace
  vin text,
  engine_code text,
  paint_code text,
  fuel_type text,
  engine_spec text,

  -- Termíny a expirace
  stk_expires_at date,
  vignette_expires_at date,
  insurance_expires_at date,

  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists vehicles_user_id_idx on public.vehicles(user_id);

drop trigger if exists set_vehicles_updated_at on public.vehicles;
create trigger set_vehicles_updated_at
  before update on public.vehicles
  for each row
  execute function public.handle_updated_at();

-- ============================================================================
-- TABULKA: service_records (Servisní knížka — úkony, díly, úpravy)
-- ============================================================================
create table if not exists public.service_records (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,

  title text not null,
  category text not null check (
    category in (
      'Pravidelný servis',
      'Oprava',
      'Úpravy / Tuning',
      'Detailing & Péče',
      'Pneumatiky & Kola',
      'Administrativa / STK / Poplatky'
    )
  ),
  record_date date not null default current_date,
  mileage integer not null default 0 check (mileage >= 0),

  parts_cost numeric(12, 2) not null default 0 check (parts_cost >= 0),
  labor_cost numeric(12, 2) not null default 0 check (labor_cost >= 0),
  total_cost numeric(12, 2) generated always as (parts_cost + labor_cost) stored,

  oem_codes text,
  product_url text,
  notes text,

  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists service_records_vehicle_date_idx
  on public.service_records(vehicle_id, record_date desc);
create index if not exists service_records_user_id_idx
  on public.service_records(user_id);

drop trigger if exists set_service_records_updated_at on public.service_records;
create trigger set_service_records_updated_at
  before update on public.service_records
  for each row
  execute function public.handle_updated_at();

-- ============================================================================
-- TABULKA: record_photos (Fotogalerie k záznamům)
-- ============================================================================
create table if not exists public.record_photos (
  id uuid primary key default gen_random_uuid(),
  record_id uuid not null references public.service_records(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,

  storage_path text not null,
  caption text,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists record_photos_record_id_idx on public.record_photos(record_id);
create index if not exists record_photos_user_id_idx on public.record_photos(user_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================
alter table public.vehicles enable row level security;
alter table public.service_records enable row level security;
alter table public.record_photos enable row level security;

-- Politiky pro `vehicles`
drop policy if exists "vehicles_select_own" on public.vehicles;
create policy "vehicles_select_own"
  on public.vehicles for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "vehicles_insert_own" on public.vehicles;
create policy "vehicles_insert_own"
  on public.vehicles for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "vehicles_update_own" on public.vehicles;
create policy "vehicles_update_own"
  on public.vehicles for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "vehicles_delete_own" on public.vehicles;
create policy "vehicles_delete_own"
  on public.vehicles for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- Politiky pro `service_records` (ověření vlastníka i vlastnictví vozidla)
drop policy if exists "service_records_select_own" on public.service_records;
create policy "service_records_select_own"
  on public.service_records for select
  to authenticated
  using (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.vehicles v
      where v.id = vehicle_id and v.user_id = (select auth.uid())
    )
  );

drop policy if exists "service_records_insert_own" on public.service_records;
create policy "service_records_insert_own"
  on public.service_records for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.vehicles v
      where v.id = vehicle_id and v.user_id = (select auth.uid())
    )
  );

drop policy if exists "service_records_update_own" on public.service_records;
create policy "service_records_update_own"
  on public.service_records for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.vehicles v
      where v.id = vehicle_id and v.user_id = (select auth.uid())
    )
  );

drop policy if exists "service_records_delete_own" on public.service_records;
create policy "service_records_delete_own"
  on public.service_records for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- Politiky pro `record_photos`
drop policy if exists "record_photos_select_own" on public.record_photos;
create policy "record_photos_select_own"
  on public.record_photos for select
  to authenticated
  using (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.service_records r
      where r.id = record_id and r.user_id = (select auth.uid())
    )
  );

drop policy if exists "record_photos_insert_own" on public.record_photos;
create policy "record_photos_insert_own"
  on public.record_photos for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.service_records r
      where r.id = record_id and r.user_id = (select auth.uid())
    )
  );

drop policy if exists "record_photos_delete_own" on public.record_photos;
create policy "record_photos_delete_own"
  on public.record_photos for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- ============================================================================
-- SUPABASE STORAGE BUCKET: garage-media
-- Soukromý bucket; přístup mají pouze přihlášení vlastníci ke své složce {uid}/
-- ============================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'garage-media',
  'garage-media',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "garage_media_select_own" on storage.objects;
create policy "garage_media_select_own"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'garage-media'
    and (select auth.uid())::text = (storage.foldername(name))[1]
  );

drop policy if exists "garage_media_insert_own" on storage.objects;
create policy "garage_media_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'garage-media'
    and (select auth.uid())::text = (storage.foldername(name))[1]
  );

drop policy if exists "garage_media_update_own" on storage.objects;
create policy "garage_media_update_own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'garage-media'
    and (select auth.uid())::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'garage-media'
    and (select auth.uid())::text = (storage.foldername(name))[1]
  );

drop policy if exists "garage_media_delete_own" on storage.objects;
create policy "garage_media_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'garage-media'
    and (select auth.uid())::text = (storage.foldername(name))[1]
  );
