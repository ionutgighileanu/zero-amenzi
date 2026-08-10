-- Web Push (D-013): subscription-uri browser + tracking pe notifications_log
-- + preferință email pe user. Vezi DECISIONS.md D-013 — push e canal
-- suplimentar, email rămâne activ by default.

-- ---------------------------------------------------------------------------
-- push_subscriptions — un rând per abonament PushManager al unui browser.
-- Un user poate avea mai multe (telefon + laptop). endpoint e unic per
-- abonament; (user_id, endpoint) unic ca să nu dublăm la resubscribe.
-- ---------------------------------------------------------------------------
create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now(),
  unique (user_id, endpoint)
);

create index push_subscriptions_user_id_idx on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

-- Doar propriul user: citește, creează, șterge propriile abonamente.
-- Fără UPDATE — /api/push/subscribe face delete+insert la resubscribe
-- (vezi ruta), nu upsert, ca să nu fie nevoie de o policy suplimentară.
create policy "push_subscriptions_select_own" on public.push_subscriptions
  for select using (user_id = auth.uid());

create policy "push_subscriptions_insert_own" on public.push_subscriptions
  for insert with check (user_id = auth.uid());

create policy "push_subscriptions_delete_own" on public.push_subscriptions
  for delete using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- notifications_log — tracking Web Push, în completarea email_sent_at.
-- Populate de cron (push_sent_at) și de service worker via /api/push/clicked
-- și /api/push/dismissed (push_clicked_at / push_dismissed_at), autentificate
-- ca userul propriu — reutilizează policy-ul de update existent
-- (notifications_log_update_mark_read).
-- ---------------------------------------------------------------------------
alter table public.notifications_log
  add column if not exists push_sent_at timestamptz,
  add column if not exists push_clicked_at timestamptz,
  add column if not exists push_dismissed_at timestamptz;

-- ---------------------------------------------------------------------------
-- users — preferință email, activă by default (D-013: email rămâne canalul
-- de bază, push e bonus opțional). In-app nu are coloană — nu poate fi
-- dezactivat. Starea push nu are coloană — se derivă din existența unui
-- rând în push_subscriptions.
-- ---------------------------------------------------------------------------
alter table public.users
  add column if not exists email_notifications boolean not null default true;
