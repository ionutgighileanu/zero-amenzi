-- Reparare drift producție.
--
-- Opt migrații (20260807000000 → 20260916120000) sunt marcate ca aplicate în
-- supabase_migrations.schema_migrations, dar DDL-ul lor n-a avut niciodată
-- efect asupra bazei de producție. Dovada: public.users are exact coloanele
-- din 20260720143335, deși nu e dropat de nicio migrație, iar
-- email_notifications (20260810090000) lipsește. `db push` nu le va rula
-- niciodată, fiind marcate ca aplicate — de-aia există fișierul ăsta.
--
-- REGULI:
--   * nu atinge nimic ce există deja — IF NOT EXISTS peste tot
--   * niciun DROP
--   * idempotentă: poate rula de oricâte ori
--
-- Definițiile sunt în forma FINALĂ (ultima versiune din lanțul de migrații),
-- nu în cea inițială: policy-ul de INSERT public și attach_verification_email
-- vin din 20260916120000, nu din 20260809184633.
--
-- Limitare asumată a lui „IF NOT EXISTS" pe policy-uri și constrângeri: dacă
-- un obiect cu același nume există deja cu o definiție mai veche, rămâne
-- neatins. Pe producția de azi nu e cazul — tabelele lipsesc complet, deci
-- totul se creează de la zero în forma finală.
--
-- Ce NU e aici, și de ce:
--   * 20260807000000 (coloane pe notifications_log) și coloanele push_* din
--     20260810090000 — notifications_log a fost recreat de 20260917100000 cu
--     forma finală inclusă. Nimic de reparat.
--   * 20260817120000 (policy-uri admin pe vehicles/vehicle_docs) — recreate de
--     20260918130000 (D-022), care rulează imediat după fișierul ăsta. Ar fi
--     duplicat. Ordinea nu e întâmplătoare: D-022 face
--     `grant update (email_notifications) on public.users`, deci coloana din
--     secțiunea 1 trebuie să existe înainte ca el să ruleze.
--   * Plafoanele de lungime din 20260916120000 pe vehicles, vehicle_docs,
--     drivers, driver_certs, alert_types — incluse inline la recreare în
--     20260917100000. organizations nu mai există prin design (D-019).

-- ===========================================================================
-- 1. users.email_notifications (20260810090000)
--    Preferință email, activă implicit. Citită de check-expiries și scrisă
--    de pagina de setări — ambele rupte în producție până acum.
-- ===========================================================================
alter table public.users
  add column if not exists email_notifications boolean not null default true;

-- ===========================================================================
-- 2. verification_requests (20260809184633 + 20260817140000 + 20260916100000
--    + 20260916120000)
-- ===========================================================================
create table if not exists public.verification_requests (
  id uuid primary key default gen_random_uuid(),
  plate_number text not null,
  email text,
  status text not null default 'pending' check (status in ('pending', 'completed')),
  result_itp text check (result_itp in ('valid', 'expirat', 'nu_gasit')),
  result_rca text check (result_rca in ('valid', 'expirat', 'nu_gasit')),
  result_rovinieta text check (result_rovinieta in ('valid', 'expirat', 'nu_gasit')),
  result_itp_expires date,
  result_rca_expires date,
  result_rovinieta_expires date,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  token uuid not null default gen_random_uuid()
);

-- Coloane adăugate ulterior, separate ca să acopere și cazul în care tabelul
-- ar exista într-o formă parțială.
alter table public.verification_requests
  add column if not exists user_id uuid references public.users (id) on delete set null;

alter table public.verification_requests
  add column if not exists admin_notified_at timestamptz;

create unique index if not exists verification_requests_token_idx
  on public.verification_requests (token);

create index if not exists verification_requests_status_created_idx
  on public.verification_requests (status, created_at);

create index if not exists verification_requests_user_id_idx
  on public.verification_requests (user_id)
  where user_id is not null;

create index if not exists verification_requests_pending_digest_idx
  on public.verification_requests (created_at)
  where admin_notified_at is null;

comment on column public.verification_requests.admin_notified_at is
  'Momentul în care cererea a intrat într-un digest trimis adminului. NULL = încă neanunțată. Scris doar de cronul de digest, cu service_role.';

-- Plafoane (20260916120000). ADD CONSTRAINT n-are IF NOT EXISTS, deci
-- verificăm în pg_constraint.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'verification_requests_plate_len') then
    alter table public.verification_requests
      add constraint verification_requests_plate_len check (char_length(plate_number) between 1 and 15);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'verification_requests_email_len') then
    alter table public.verification_requests
      add constraint verification_requests_email_len check (email is null or char_length(email) <= 254);
  end if;
end $$;

alter table public.verification_requests enable row level security;

-- INSERT public — forma finală din 20260916120000: blochează forjarea unui
-- rezultat, suprimarea din digest (admin_notified_at) și legarea cererii de
-- contul altcuiva (user_id).
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'verification_requests'
      and policyname = 'verification_requests_insert_public'
  ) then
    create policy "verification_requests_insert_public" on public.verification_requests
      for insert
      with check (
        status = 'pending'
        and result_itp is null and result_rca is null and result_rovinieta is null
        and result_itp_expires is null and result_rca_expires is null and result_rovinieta_expires is null
        and completed_at is null
        and admin_notified_at is null
        and (user_id is null or user_id = auth.uid())
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'verification_requests'
      and policyname = 'verification_requests_select_admin'
  ) then
    create policy "verification_requests_select_admin" on public.verification_requests
      for select
      using ((auth.jwt() ->> 'email') = 'ionut.gighileanu@gmail.com');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'verification_requests'
      and policyname = 'verification_requests_update_admin'
  ) then
    create policy "verification_requests_update_admin" on public.verification_requests
      for update
      using ((auth.jwt() ->> 'email') = 'ionut.gighileanu@gmail.com')
      with check ((auth.jwt() ->> 'email') = 'ionut.gighileanu@gmail.com');
  end if;
end $$;

-- attach_verification_email — forma finală, cu validare (20260916120000).
-- `create or replace` e idempotent prin natură.
create or replace function public.attach_verification_email(p_token uuid, p_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := nullif(trim(p_email), '');
begin
  if v_email is null then
    return;
  end if;
  if char_length(v_email) > 254 then
    raise exception 'email prea lung' using errcode = 'check_violation';
  end if;
  -- Format lax, doar ca să nu ajungă gunoi în câmpul `to` — validarea
  -- strictă rămâne în aplicație; aici e plasa de siguranță.
  if v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'email invalid' using errcode = 'check_violation';
  end if;

  update public.verification_requests
  set email = v_email
  where token = p_token
    and status = 'pending'
    and email is null;
end;
$$;

grant execute on function public.attach_verification_email(uuid, text) to anon, authenticated;

-- ===========================================================================
-- 3. push_subscriptions (20260810090000 + 20260916110000 + 20260916120000)
-- ===========================================================================
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now(),
  unique (user_id, endpoint)
);

create index if not exists push_subscriptions_user_id_idx
  on public.push_subscriptions (user_id);

do $$
begin
  -- Allow-list de host (20260916110000). De ținut sincron manual cu
  -- ALLOWED_PUSH_HOSTS din src/lib/push/allowed-endpoints.ts.
  if not exists (select 1 from pg_constraint where conname = 'push_subscriptions_endpoint_allowed') then
    alter table public.push_subscriptions
      add constraint push_subscriptions_endpoint_allowed
      check (
        endpoint like 'https://fcm.googleapis.com/%'
        or endpoint like 'https://%.fcm.googleapis.com/%'
        or endpoint like 'https://updates.push.services.mozilla.com/%'
        or endpoint like 'https://%.updates.push.services.mozilla.com/%'
        or endpoint like 'https://web.push.apple.com/%'
        or endpoint like 'https://%.web.push.apple.com/%'
      );
  end if;

  -- Plafoane de lungime (20260916120000).
  if not exists (select 1 from pg_constraint where conname = 'push_subscriptions_endpoint_len') then
    alter table public.push_subscriptions
      add constraint push_subscriptions_endpoint_len check (char_length(endpoint) <= 2048);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'push_subscriptions_p256dh_len') then
    alter table public.push_subscriptions
      add constraint push_subscriptions_p256dh_len check (char_length(p256dh) between 1 and 256);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'push_subscriptions_auth_len') then
    alter table public.push_subscriptions
      add constraint push_subscriptions_auth_len check (char_length(auth) between 1 and 256);
  end if;
end $$;

alter table public.push_subscriptions enable row level security;

-- Doar propriul user. Fără UPDATE — /api/push/subscribe face delete+insert la
-- resubscribe, deliberat, ca să nu fie nevoie de o policy suplimentară.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'push_subscriptions'
      and policyname = 'push_subscriptions_select_own'
  ) then
    create policy "push_subscriptions_select_own" on public.push_subscriptions
      for select using (user_id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'push_subscriptions'
      and policyname = 'push_subscriptions_insert_own'
  ) then
    create policy "push_subscriptions_insert_own" on public.push_subscriptions
      for insert with check (user_id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'push_subscriptions'
      and policyname = 'push_subscriptions_delete_own'
  ) then
    create policy "push_subscriptions_delete_own" on public.push_subscriptions
      for delete using (user_id = auth.uid());
  end if;
end $$;

-- ===========================================================================
-- 4. notifications — in-app, per user (20260817140000)
--    Depinde de verification_requests, deci vine după ea.
-- ===========================================================================
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  type text not null check (type in ('verification_completed')),
  verification_request_id uuid references public.verification_requests (id) on delete cascade,
  title text not null,
  body text not null,
  href text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_unread_idx
  on public.notifications (user_id, created_at desc)
  where read_at is null;

-- O cerere finalizată produce exact o notificare, chiar la retry.
create unique index if not exists notifications_verification_request_idx
  on public.notifications (verification_request_id)
  where verification_request_id is not null;

alter table public.notifications enable row level security;

-- SELECT/UPDATE doar destinatarul. Fără policy de INSERT: rândurile se scriu
-- exclusiv cu service_role din completeVerificationAction.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'notifications'
      and policyname = 'notifications_select_own'
  ) then
    create policy "notifications_select_own" on public.notifications
      for select using (user_id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'notifications'
      and policyname = 'notifications_update_own'
  ) then
    create policy "notifications_update_own" on public.notifications
      for update using (user_id = auth.uid())
      with check (user_id = auth.uid());
  end if;
end $$;
