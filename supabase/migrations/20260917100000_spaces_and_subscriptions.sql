-- Spaces unificate + abonamente (D-019).
--
-- Înlocuiește modelul „garaj personal hardcodat în frontend + organizations"
-- cu o singură entitate: `spaces`. Fiecare spațiu (personal sau fleet) deține
-- vehicule și are propriul abonament. Vehiculele se leagă de space_id, nu de
-- owner_id/org_id separat.
--
-- DISTRUCTIV: șterge `organizations` și recreează tabelele care depindeau de
-- ea. Sigur doar pentru că baza e goală (niciun user, niciun vehicul) —
-- confirmat explicit înainte de scriere. Pe o bază cu date ar fi nevoie de
-- migrare de conținut, nu de drop/create.
--
-- Model de abonament pe două niveluri:
--   spaces.subscription_status  — starea trialului la nivel de spațiu
--   vehicles.paid_until         — plata concretă, per vehicul
-- Regula de acces efectivă (vezi src/lib/subscription.ts):
--   accesibil dacă (spațiul e 'trialing' și trial_ends_at > acum)
--                  SAU vehicles.paid_until > acum
-- Deci expirarea trialului NU blochează vehiculele deja plătite.

-- ---------------------------------------------------------------------------
-- 0. Curățare. Ordinea contează mai puțin datorită CASCADE, dar o păstrăm
--    explicită ca să se vadă graful de dependențe.
-- ---------------------------------------------------------------------------
drop trigger if exists on_organization_created on public.organizations;
drop function if exists public.handle_new_organization();
drop function if exists public.is_org_member(uuid);
drop function if exists public.is_org_admin(uuid);

drop table if exists public.notifications_log cascade;
drop table if exists public.alert_types cascade;
drop table if exists public.driver_certs cascade;
drop table if exists public.drivers cascade;
drop table if exists public.vehicle_docs cascade;
drop table if exists public.vehicles cascade;
drop table if exists public.memberships cascade;
drop table if exists public.organizations cascade;

-- ---------------------------------------------------------------------------
-- 1. spaces — entitatea care deține vehicule și are abonament
-- ---------------------------------------------------------------------------
create table public.spaces (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('personal', 'fleet')),
  name text not null,
  owner_id uuid not null references public.users (id) on delete cascade,
  -- Doar flotele au CUI; la persoane fizice rămâne null.
  cui text,
  subscription_status text not null default 'trialing'
    check (subscription_status in ('trialing', 'active', 'expired')),
  -- Default-ul nu e cosmetic: INSERT-ul pe coloana asta e revocat pentru
  -- clienți (vezi secțiunea 11), deci valoarea TREBUIE să vină din default,
  -- altfel crearea unei flote din aplicație ar pica pe NOT NULL.
  trial_ends_at timestamptz not null default (now() + interval '1 year'),
  created_at timestamptz not null default now(),

  constraint spaces_cui_only_fleet check (kind = 'fleet' or cui is null),
  constraint spaces_name_len check (char_length(name) between 1 and 200),
  constraint spaces_cui_len check (cui is null or char_length(cui) <= 20)
);

-- Exact un spațiu personal per user, garantat de DB. Flotele sunt nelimitate.
create unique index spaces_one_personal_per_owner
  on public.spaces (owner_id)
  where kind = 'personal';

create index spaces_owner_id_idx on public.spaces (owner_id);

comment on column public.spaces.subscription_status is
  'Status derivat, ținut la zi de jobul de expirare. Regula de acces reală combină asta cu vehicles.paid_until — vezi src/lib/subscription.ts.';

-- ---------------------------------------------------------------------------
-- 2. memberships — user ↔ spațiu
-- ---------------------------------------------------------------------------
create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  space_id uuid not null references public.spaces (id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'member')),
  created_at timestamptz not null default now(),
  unique (user_id, space_id)
);

create index memberships_user_id_idx on public.memberships (user_id);
create index memberships_space_id_idx on public.memberships (space_id);

-- ---------------------------------------------------------------------------
-- 3. Helpere RLS. SECURITY DEFINER ca să nu creeze recursie când sunt
--    apelate din policies pe memberships/spaces.
-- ---------------------------------------------------------------------------
create function public.is_space_member(target_space_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.memberships
    where space_id = target_space_id and user_id = auth.uid()
  );
$$;

create function public.is_space_admin(target_space_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.memberships
    where space_id = target_space_id
      and user_id = auth.uid()
      and role in ('owner', 'admin')
  );
$$;

-- ---------------------------------------------------------------------------
-- 4. normalize_plate — cheia anti-abuz.
--    „B 12 ABC", „b12abc" și „B-12-ABC" dau toate „B12ABC", deci trialul nu
--    poate fi luat de mai multe ori scriind plăcuța altfel.
--    ATENȚIE: oglindește normalizePlate() din src/lib/plate.ts. Postgres nu
--    poate importa funcția din TS — dacă una se schimbă, schimb-o și pe
--    cealaltă.
-- ---------------------------------------------------------------------------
create function public.normalize_plate(raw text)
returns text
language sql
immutable
as $$
  select upper(regexp_replace(coalesce(raw, ''), '[^A-Za-z0-9]', '', 'g'));
$$;

-- ---------------------------------------------------------------------------
-- 5. plate_trials — o plăcuță poate beneficia o singură dată de trial.
--    Cheia primară pe plăcuța normalizată face regula imposibil de ocolit
--    prin cont nou: nu e legată de user, ci de mașină.
-- ---------------------------------------------------------------------------
create table public.plate_trials (
  plate_normalized text primary key,
  first_space_id uuid references public.spaces (id) on delete set null,
  trial_used_at timestamptz not null default now()
);

comment on table public.plate_trials is
  'Evidență anti-abuz: plăcuțele care au consumat deja perioada de trial. Scrisă exclusiv de triggerul de pe vehicles, niciodată de client.';

-- ---------------------------------------------------------------------------
-- 6. vehicles — legate de spațiu, cu plata proprie
-- ---------------------------------------------------------------------------
create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces (id) on delete cascade,
  plate text not null,
  -- Completată automat de trigger din `plate`; folosită la anti-abuz și la
  -- căutare. Nu se scrie din aplicație.
  plate_normalized text not null,
  vin text not null,
  model text,
  is_truck boolean not null default false,
  -- Data până la care vehiculul e plătit. null = nu e plătit individual
  -- (în trial, sau expirat). Înlocuiește vechiul is_premium.
  paid_until timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),

  constraint vehicles_plate_len check (char_length(plate) between 1 and 32),
  constraint vehicles_vin_len   check (char_length(vin) between 1 and 32),
  constraint vehicles_model_len check (model is null or char_length(model) <= 120)
);

create index vehicles_space_id_idx on public.vehicles (space_id) where deleted_at is null;
create index vehicles_plate_normalized_idx on public.vehicles (plate_normalized);

-- ---------------------------------------------------------------------------
-- 7. Triggerul care impune regulile de abonament la nivel de DB.
--    Rulează indiferent pe unde vine insertul — inclusiv un POST direct la
--    REST-ul Supabase cu cheia anon, care ocolește complet aplicația.
-- ---------------------------------------------------------------------------
create function public.enforce_vehicle_subscription_rules()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text;
  v_trial_ends timestamptz;
begin
  new.plate_normalized := public.normalize_plate(new.plate);

  if new.plate_normalized = '' then
    raise exception 'plate_invalid' using errcode = 'check_violation';
  end if;

  select subscription_status, trial_ends_at
    into v_status, v_trial_ends
    from public.spaces
   where id = new.space_id;

  if not found then
    raise exception 'space_not_found' using errcode = 'foreign_key_violation';
  end if;

  -- Spațiu expirat: nu se mai pot adăuga vehicule deloc.
  if v_status = 'expired' then
    raise exception 'space_expired' using errcode = 'check_violation';
  end if;

  -- Trial activ: plăcuța trebuie să fie „nefolosită". Spațiile cu status
  -- 'active' (au plătit) nu consumă trial, deci pot adăuga orice plăcuță,
  -- inclusiv una care a mai fost în trial pe alt cont — cazul mașinii
  -- vândute, care se rezolvă plătind.
  if v_status = 'trialing' then
    if v_trial_ends <= now() then
      raise exception 'trial_expired' using errcode = 'check_violation';
    end if;

    if exists (
      select 1 from public.plate_trials
      where plate_normalized = new.plate_normalized
    ) then
      raise exception 'plate_trial_already_used' using errcode = 'check_violation';
    end if;

    insert into public.plate_trials (plate_normalized, first_space_id)
    values (new.plate_normalized, new.space_id);
  end if;

  return new;
end;
$$;

create trigger vehicles_enforce_subscription
  before insert on public.vehicles
  for each row execute function public.enforce_vehicle_subscription_rules();

-- Menține plate_normalized sincron dacă plăcuța e corectată ulterior.
create function public.sync_vehicle_plate_normalized()
returns trigger
language plpgsql
as $$
begin
  new.plate_normalized := public.normalize_plate(new.plate);
  return new;
end;
$$;

create trigger vehicles_sync_plate_normalized
  before update of plate on public.vehicles
  for each row execute function public.sync_vehicle_plate_normalized();

-- ---------------------------------------------------------------------------
-- 8. Restul tabelelor, repointate pe space_id
-- ---------------------------------------------------------------------------
create table public.vehicle_docs (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles (id) on delete cascade,
  type text not null,
  expires_at date not null,
  created_at timestamptz not null default now(),
  constraint vehicle_docs_type_len check (char_length(type) between 1 and 60)
);

create index vehicle_docs_vehicle_id_idx on public.vehicle_docs (vehicle_id);

create table public.drivers (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces (id) on delete cascade,
  name text not null,
  phone text not null,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  constraint drivers_name_len  check (char_length(name) between 1 and 120),
  constraint drivers_phone_len check (char_length(phone) between 1 and 32)
);

create index drivers_space_id_idx on public.drivers (space_id) where deleted_at is null;

create table public.driver_certs (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null references public.drivers (id) on delete cascade,
  type text not null,
  expires_at date not null,
  created_at timestamptz not null default now(),
  constraint driver_certs_type_len check (char_length(type) between 1 and 60)
);

create index driver_certs_driver_id_idx on public.driver_certs (driver_id);

create table public.alert_types (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  constraint alert_types_name_len check (char_length(name) between 1 and 60)
);

create index alert_types_space_id_idx on public.alert_types (space_id);

-- notifications_log — recreat într-o singură definiție curată, în loc de
-- schema inițială + straturile din 20260807000000.
create table public.notifications_log (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces (id) on delete cascade,
  user_id uuid references public.users (id) on delete cascade,
  vehicle_id uuid references public.vehicles (id) on delete cascade,
  driver_id uuid references public.drivers (id) on delete cascade,
  vehicle_doc_id uuid references public.vehicle_docs (id) on delete cascade,
  driver_cert_id uuid references public.driver_certs (id) on delete cascade,
  doc_type text not null,
  channel text not null check (channel in ('in_app', 'email', 'sms', 'push')),
  days_before integer,
  expires_at date,
  read_at timestamptz,
  email_sent_at timestamptz,
  -- Scrisă de cron după trimiterea push-ului; celelalte două de service worker
  -- prin /api/push/clicked și /api/push/dismissed.
  push_sent_at timestamptz,
  push_clicked_at timestamptz,
  push_dismissed_at timestamptz,
  sent_at timestamptz not null default now(),

  constraint notifications_log_doc_xor check (
    (vehicle_doc_id is not null and driver_cert_id is null) or
    (vehicle_doc_id is null and driver_cert_id is not null)
  )
);

create index notifications_log_space_id_idx on public.notifications_log (space_id);
create index notifications_log_unread_idx
  on public.notifications_log (space_id, user_id)
  where read_at is null;

-- Idempotență: aceeași alertă (document + prag) nu se poate scrie de două ori.
create unique index notifications_log_vehicle_doc_days_idx
  on public.notifications_log (vehicle_doc_id, days_before)
  where vehicle_doc_id is not null;

create unique index notifications_log_driver_cert_days_idx
  on public.notifications_log (driver_cert_id, days_before)
  where driver_cert_id is not null;

-- ---------------------------------------------------------------------------
-- 9. La signup: spațiu personal + membership, automat.
--    Înlocuiește handle_new_user ca să nu mai existe un moment în care userul
--    are cont dar n-are unde pune mașini.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_space_id uuid;
begin
  insert into public.users (id, email)
  values (new.id, new.email);

  insert into public.spaces (kind, name, owner_id, trial_ends_at)
  values ('personal', 'Garajul meu', new.id, now() + interval '1 year')
  returning id into v_space_id;

  insert into public.memberships (user_id, space_id, role)
  values (new.id, v_space_id, 'owner');

  return new;
end;
$$;

-- Orice spațiu nou (flotă creată din aplicație) își primește owner-ul ca
-- membership, la fel cum făcea vechiul handle_new_organization.
create function public.handle_new_space()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.memberships (user_id, space_id, role)
  values (new.owner_id, new.id, 'owner')
  on conflict (user_id, space_id) do nothing;
  return new;
end;
$$;

create trigger on_space_created
  after insert on public.spaces
  for each row execute function public.handle_new_space();

-- ---------------------------------------------------------------------------
-- 10. RLS
-- ---------------------------------------------------------------------------
alter table public.spaces            enable row level security;
alter table public.memberships       enable row level security;
alter table public.vehicles          enable row level security;
alter table public.vehicle_docs      enable row level security;
alter table public.drivers           enable row level security;
alter table public.driver_certs      enable row level security;
alter table public.alert_types       enable row level security;
alter table public.notifications_log enable row level security;
alter table public.plate_trials      enable row level security;

-- spaces
create policy "spaces_select_member" on public.spaces
  for select using (public.is_space_member(id));

create policy "spaces_insert_own" on public.spaces
  for insert with check (
    owner_id = auth.uid()
    -- Spațiul personal e creat exclusiv de trigger la signup; din aplicație
    -- se pot crea doar flote.
    and kind = 'fleet'
  );

create policy "spaces_update_admin" on public.spaces
  for update using (public.is_space_admin(id))
  with check (public.is_space_admin(id));

create policy "spaces_delete_owner" on public.spaces
  for delete using (owner_id = auth.uid() and kind = 'fleet');

-- memberships
create policy "memberships_select_same_space" on public.memberships
  for select using (public.is_space_member(space_id));

create policy "memberships_insert_admin" on public.memberships
  for insert with check (public.is_space_admin(space_id));

create policy "memberships_update_admin" on public.memberships
  for update using (public.is_space_admin(space_id))
  with check (public.is_space_admin(space_id));

create policy "memberships_delete_admin_or_self" on public.memberships
  for delete using (public.is_space_admin(space_id) or user_id = auth.uid());

-- vehicles
create policy "vehicles_select_member" on public.vehicles
  for select using (public.is_space_member(space_id));

create policy "vehicles_insert_admin" on public.vehicles
  for insert with check (public.is_space_admin(space_id));

create policy "vehicles_update_admin" on public.vehicles
  for update using (public.is_space_admin(space_id))
  with check (public.is_space_admin(space_id));

create policy "vehicles_delete_admin" on public.vehicles
  for delete using (public.is_space_admin(space_id));

-- vehicle_docs — prin vehicul
create policy "vehicle_docs_select_via_vehicle" on public.vehicle_docs
  for select using (exists (
    select 1 from public.vehicles v
    where v.id = vehicle_id and public.is_space_member(v.space_id)
  ));

create policy "vehicle_docs_write_via_vehicle" on public.vehicle_docs
  for all using (exists (
    select 1 from public.vehicles v
    where v.id = vehicle_id and public.is_space_admin(v.space_id)
  ))
  with check (exists (
    select 1 from public.vehicles v
    where v.id = vehicle_id and public.is_space_admin(v.space_id)
  ));

-- drivers
create policy "drivers_select_member" on public.drivers
  for select using (public.is_space_member(space_id));

create policy "drivers_write_admin" on public.drivers
  for all using (public.is_space_admin(space_id))
  with check (public.is_space_admin(space_id));

-- driver_certs — prin șofer
create policy "driver_certs_select_via_driver" on public.driver_certs
  for select using (exists (
    select 1 from public.drivers d
    where d.id = driver_id and public.is_space_member(d.space_id)
  ));

create policy "driver_certs_write_via_driver" on public.driver_certs
  for all using (exists (
    select 1 from public.drivers d
    where d.id = driver_id and public.is_space_admin(d.space_id)
  ))
  with check (exists (
    select 1 from public.drivers d
    where d.id = driver_id and public.is_space_admin(d.space_id)
  ));

-- alert_types
create policy "alert_types_select_member" on public.alert_types
  for select using (public.is_space_member(space_id));

create policy "alert_types_write_admin" on public.alert_types
  for all using (public.is_space_admin(space_id))
  with check (public.is_space_admin(space_id));

-- notifications_log — citite de membrii spațiului, scrise doar de sistem
create policy "notifications_log_select_member" on public.notifications_log
  for select using (public.is_space_member(space_id));

create policy "notifications_log_update_mark_read" on public.notifications_log
  for update using (public.is_space_member(space_id))
  with check (public.is_space_member(space_id));

-- plate_trials — nicio policy: tabelul e scris exclusiv de triggerul
-- SECURITY DEFINER și citit doar de acesta. Cu RLS activat și zero policies,
-- clientul nu poate nici să vadă, nici să șteargă evidența anti-abuz.

-- ---------------------------------------------------------------------------
-- 11. Privilegii pe coloane — partea care face abonamentul să nu poată fi
--     falsificat.
--
--     RLS decide PE CE RÂNDURI poate scrie clientul, nu ce coloane. Fără
--     restricțiile de mai jos, un utilizator autentificat își putea da singur
--     premium cu un PATCH direct pe REST-ul Supabase:
--       PATCH /rest/v1/vehicles  { "paid_until": "2099-01-01" }
--     Policy-ul de update ar fi permis, fiindcă e propriul lui vehicul.
-- ---------------------------------------------------------------------------
revoke update (paid_until, plate_normalized, space_id)
  on public.vehicles from authenticated, anon;

revoke update (subscription_status, trial_ends_at, kind, owner_id)
  on public.spaces from authenticated, anon;

revoke insert (subscription_status, trial_ends_at)
  on public.spaces from authenticated, anon;

comment on column public.vehicles.paid_until is
  'Scrisă exclusiv server-side (service_role), din fluxul de plată. UPDATE revocat pentru authenticated/anon — vezi migrarea 20260917100000.';
