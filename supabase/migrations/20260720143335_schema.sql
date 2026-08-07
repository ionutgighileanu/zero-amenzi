-- AutoDocs — schema inițială
-- Vezi CLAUDE.md "Model de date" pentru schița originală.
-- Identity + Spaces: un cont deține un garaj personal (owner_id pe vehicles)
-- ȘI poate apartine unei/mai multor flote (org_id pe vehicles, via memberships).

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- users — oglindă publică minimă a auth.users, populată automat prin trigger
-- (vezi 20260720143336_functions.sql). Nu stocăm parole sau alte date Auth aici.
-- ---------------------------------------------------------------------------
create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now()
);

comment on table public.users is
  'Oglindă publică a auth.users. Populată automat la signup (trigger on_auth_user_created).';

-- ---------------------------------------------------------------------------
-- organizations — firme (spații B2B / flote)
-- ---------------------------------------------------------------------------
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  cui text,
  owner_id uuid not null references public.users (id) on delete restrict,
  created_at timestamptz not null default now()
);

create index organizations_owner_id_idx on public.organizations (owner_id);

-- ---------------------------------------------------------------------------
-- memberships — user ↔ org, cu rol
-- ---------------------------------------------------------------------------
create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  org_id uuid not null references public.organizations (id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'member')),
  created_at timestamptz not null default now(),
  unique (user_id, org_id)
);

create index memberships_user_id_idx on public.memberships (user_id);
create index memberships_org_id_idx on public.memberships (org_id);

-- ---------------------------------------------------------------------------
-- vehicles — mașini. Un vehicul e personal (owner_id) SAU de flotă (org_id),
-- niciodată ambele sau niciunul.
-- ---------------------------------------------------------------------------
create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  plate text not null,
  vin text not null,
  model text,
  owner_id uuid references public.users (id) on delete cascade,
  org_id uuid references public.organizations (id) on delete cascade,
  is_truck boolean not null default false,
  is_premium boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  constraint vehicles_owner_xor_org check (
    (owner_id is not null and org_id is null) or
    (owner_id is null and org_id is not null)
  )
);

create index vehicles_owner_id_idx on public.vehicles (owner_id) where deleted_at is null;
create index vehicles_org_id_idx on public.vehicles (org_id) where deleted_at is null;

-- ---------------------------------------------------------------------------
-- vehicle_docs — documente per vehicul (ITP, RCA, Rovinietă, Tahograf,
-- și alerte suplimentare cu tip liber: Extinctor, Trusă medicală, etc.)
-- ---------------------------------------------------------------------------
create table public.vehicle_docs (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles (id) on delete cascade,
  type text not null,
  expires_at date not null,
  created_at timestamptz not null default now()
);

create index vehicle_docs_vehicle_id_idx on public.vehicle_docs (vehicle_id);

-- ---------------------------------------------------------------------------
-- drivers — șoferi (doar B2B, aparțin unei flote)
-- ---------------------------------------------------------------------------
create table public.drivers (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  phone text not null,
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);

create index drivers_org_id_idx on public.drivers (org_id) where deleted_at is null;

-- ---------------------------------------------------------------------------
-- driver_certs — atestate și avize per șofer
-- ---------------------------------------------------------------------------
create table public.driver_certs (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null references public.drivers (id) on delete cascade,
  type text not null,
  expires_at date not null,
  created_at timestamptz not null default now()
);

create index driver_certs_driver_id_idx on public.driver_certs (driver_id);

-- ---------------------------------------------------------------------------
-- alert_types — tipuri de alerte suplimentare configurabile, per garaj
-- personal SAU per flotă (aceeași regulă owner_id XOR org_id ca la vehicles).
-- ---------------------------------------------------------------------------
create table public.alert_types (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.users (id) on delete cascade,
  org_id uuid references public.organizations (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  constraint alert_types_owner_xor_org check (
    (owner_id is not null and org_id is null) or
    (owner_id is null and org_id is not null)
  )
);

create index alert_types_owner_id_idx on public.alert_types (owner_id);
create index alert_types_org_id_idx on public.alert_types (org_id);

-- ---------------------------------------------------------------------------
-- notifications_log — istoric alerte trimise (email/SMS/push).
-- Scris exclusiv de sistem (service role / cron), niciodată direct de client.
-- ---------------------------------------------------------------------------
create table public.notifications_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users (id) on delete cascade,
  vehicle_id uuid references public.vehicles (id) on delete cascade,
  doc_type text not null,
  channel text not null check (channel in ('email', 'sms', 'push')),
  sent_at timestamptz not null default now()
);

create index notifications_log_user_id_idx on public.notifications_log (user_id);
