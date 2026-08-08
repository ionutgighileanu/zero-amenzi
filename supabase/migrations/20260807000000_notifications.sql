-- Extinde notifications_log pentru notificări in-app + email (cron zilnic).
-- Fiecare rând = o alertă concretă pentru UN document (vehicle_docs SAU
-- driver_certs), la un prag de zile (days_before), citită sau nu (read_at),
-- cu email trimis sau nu (email_sent_at).

-- ---------------------------------------------------------------------------
-- Coloane noi. Nullable — tabela poate avea deja rânduri (din schema
-- inițială) și nu riscăm o migrare care pică pe NOT NULL fără default.
-- Aplicația garantează completarea lor la insert.
-- ---------------------------------------------------------------------------
alter table public.notifications_log
  add column if not exists org_id uuid references public.organizations (id) on delete cascade,
  add column if not exists driver_id uuid references public.drivers (id) on delete cascade,
  add column if not exists vehicle_doc_id uuid references public.vehicle_docs (id) on delete cascade,
  add column if not exists driver_cert_id uuid references public.driver_certs (id) on delete cascade,
  add column if not exists days_before integer,
  add column if not exists expires_at date,
  add column if not exists read_at timestamptz,
  add column if not exists email_sent_at timestamptz;

-- Canalul reprezintă acum și „in_app" (rândul e el însuși notificarea din
-- clopoțel); email_sent_at urmărește separat dacă a plecat și un email.
alter table public.notifications_log drop constraint if exists notifications_log_channel_check;
alter table public.notifications_log
  add constraint notifications_log_channel_check check (channel in ('in_app', 'email', 'sms', 'push'));

-- O alertă e personală (user_id) SAU de flotă (org_id), niciodată ambele —
-- aceeași regulă ca pe vehicles/alert_types.
alter table public.notifications_log drop constraint if exists notifications_log_user_xor_org;
alter table public.notifications_log
  add constraint notifications_log_user_xor_org check (
    (user_id is not null and org_id is null) or
    (user_id is null and org_id is not null)
  );

-- O alertă e despre UN document: fie un vehicle_doc, fie un driver_cert.
alter table public.notifications_log drop constraint if exists notifications_log_doc_xor;
alter table public.notifications_log
  add constraint notifications_log_doc_xor check (
    (vehicle_doc_id is not null and driver_cert_id is null) or
    (vehicle_doc_id is null and driver_cert_id is not null)
  );

-- Idempotență la nivel de DB: nu poate exista de două ori aceeași alertă
-- (același document, același prag de zile) — plasă de siguranță sub
-- verificarea explicită din cron (rulări concurente/retry-uri Vercel Cron).
create unique index if not exists notifications_log_vehicle_doc_days_idx
  on public.notifications_log (vehicle_doc_id, days_before)
  where vehicle_doc_id is not null;

create unique index if not exists notifications_log_driver_cert_days_idx
  on public.notifications_log (driver_cert_id, days_before)
  where driver_cert_id is not null;

create index if not exists notifications_log_org_id_idx on public.notifications_log (org_id);
create index if not exists notifications_log_unread_idx
  on public.notifications_log (user_id, org_id)
  where read_at is null;

-- ---------------------------------------------------------------------------
-- RLS: vizibile pentru destinatar (user_id) sau membrii flotei (org_id);
-- marcarea „citit" e permisă aceloraşi — rândul e partajat la nivel de
-- flotă, deci „citit” e o stare comună, nu per-membru (simplificare MVP).
-- Scrierea rândurilor noi rămâne exclusiv pe service role (cron).
-- ---------------------------------------------------------------------------
drop policy if exists "notifications_log_select_own" on public.notifications_log;

create policy "notifications_log_select_own_or_org" on public.notifications_log
  for select using (user_id = auth.uid() or public.is_org_member(org_id));

create policy "notifications_log_update_mark_read" on public.notifications_log
  for update using (user_id = auth.uid() or public.is_org_member(org_id))
  with check (user_id = auth.uid() or public.is_org_member(org_id));
