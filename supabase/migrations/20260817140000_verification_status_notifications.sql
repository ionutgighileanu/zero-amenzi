-- Pagina de status a cererii de verificare (/verificare/status/[id]) +
-- notificări in-app la finalizarea cererii.
--
-- Două schimbări:
--   1. verification_requests.user_id — cine a trimis cererea, dacă era
--      autentificat la momentul respectiv. Nullable: fluxul public rămâne
--      disponibil fără cont (vezi policy-ul de INSERT de mai jos).
--   2. tabela notifications — notificări in-app adresate unui user concret.
--      Separată de notifications_log, care e strict istoric de alerte per
--      document (constrângere XOR pe vehicle_doc_id/driver_cert_id, deci
--      n-ar putea găzdui o notificare fără document).

-- ---------------------------------------------------------------------------
-- 1. user_id pe verification_requests
-- ---------------------------------------------------------------------------
alter table public.verification_requests
  add column if not exists user_id uuid references public.users (id) on delete set null;

create index if not exists verification_requests_user_id_idx
  on public.verification_requests (user_id)
  where user_id is not null;

-- INSERT-ul public capătă o condiție nouă: un client poate lega cererea DOAR
-- de propriul cont (sau de niciunul). Fără asta, un vizitator anonim ar putea
-- insera user_id-ul altcuiva și i-ar umple clopoțelul cu notificări străine.
drop policy if exists "verification_requests_insert_public" on public.verification_requests;

create policy "verification_requests_insert_public" on public.verification_requests
  for insert
  with check (
    status = 'pending'
    and result_itp is null and result_rca is null and result_rovinieta is null
    and result_itp_expires is null and result_rca_expires is null and result_rovinieta_expires is null
    and completed_at is null
    and (user_id is null or user_id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- 2. notifications — notificări in-app per user
-- ---------------------------------------------------------------------------
create table public.notifications (
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

create index notifications_user_unread_idx
  on public.notifications (user_id, created_at desc)
  where read_at is null;

-- O cerere finalizată produce exact o notificare, chiar dacă adminul apasă
-- „Completează" de două ori sau un retry reintră în aceeași acțiune.
create unique index notifications_verification_request_idx
  on public.notifications (verification_request_id)
  where verification_request_id is not null;

alter table public.notifications enable row level security;

-- SELECT/UPDATE — doar destinatarul. UPDATE există exclusiv pentru marcarea
-- „citit"; `with check` pe același predicat împiedică mutarea rândului pe
-- alt user_id printr-un update.
create policy "notifications_select_own" on public.notifications
  for select using (user_id = auth.uid());

create policy "notifications_update_own" on public.notifications
  for update using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Fără policy de INSERT: rândurile sunt scrise exclusiv cu service_role, din
-- completeVerificationAction (adminul creează notificarea pentru ALT user,
-- ceea ce nicio policy bazată pe auth.uid() n-ar permite). Același tipar ca
-- notifications_log, scrisă doar de cron.
