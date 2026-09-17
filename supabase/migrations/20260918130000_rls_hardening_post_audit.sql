-- Hardening RLS după auditul complet (D-022).
--
-- Cinci dintre cele șase probleme găsite se rezolvă aici; prima (guard pe
-- CRON_SECRET) e în cod, nu în DB.
--
-- ===========================================================================
-- NOTĂ CENTRALĂ: de ce `revoke ... (coloană)` singur nu e de ajuns
-- ===========================================================================
-- În Postgres, privilegiile la nivel de TABEL și cele la nivel de COLOANĂ sunt
-- straturi independente, iar un UPDATE pe o coloană trece dacă rolul are
-- dreptul la nivel de tabel SAU pe coloana respectivă. Nu există „grant
-- negativ": un `revoke update (col)` șterge doar un grant de coloană, nu scade
-- nimic din unul de tabel.
--
-- Supabase acordă implicit `grant all on all tables in schema public` pentru
-- anon și authenticated. Deci un `revoke update (paid_until)` pe un rol care
-- are deja UPDATE la nivel de tabel e, foarte probabil, fără efect — inclusiv
-- cel scris în migrarea 20260917100000, care era descris acolo drept „partea
-- care face abonamentul să nu poată fi falsificat".
--
-- Nu am putut confirma asta pe o bază reală (fără Docker local), deci în loc
-- să pariez pe o interpretare, folosesc peste tot forma care e corectă în
-- ambele: revoc dreptul la nivel de tabel, apoi acord explicit coloanele
-- permise. Allow-list, nu deny-list.
--
-- De verificat în SQL Editor după aplicare:
--   select table_name, column_name, privilege_type
--     from information_schema.column_privileges
--    where grantee = 'authenticated' and table_schema = 'public'
--    order by table_name, column_name;
--
-- service_role nu e atins de nimic de mai jos — cron-urile și webhook-ul de
-- plată trebuie să scrie exact coloanele interzise clienților.

-- ---------------------------------------------------------------------------
-- FIX 2. users.email — editabil de client, iar alertele pleacă acolo.
--
-- `users_update_own` permitea UPDATE pe orice coloană a rândului propriu, iar
-- check-expiries citește destinatarul din public.users.email. Un utilizator
-- putea pune adresa altcuiva și folosi contul nostru Resend ca să trimită
-- către un terț. Emailul real se schimbă prin Supabase Auth, care sincronizează
-- oglinda asta — nu are de ce să fie scriibil direct.
-- ---------------------------------------------------------------------------
revoke update on public.users from anon, authenticated;
grant update (email_notifications) on public.users to authenticated;

-- ---------------------------------------------------------------------------
-- FIX 3. notifications_log — UPDATE prea permisiv.
--
-- Policy-ul `notifications_log_update_mark_read` rămâne neschimbat: el decide
-- PE CE RÂNDURI se poate scrie (cele din spațiile în care userul e membru), și
-- o policy RLS nu poate restrânge coloane — pentru asta există exact
-- privilegiile de mai jos. Fără ele, un membru putea rescrie `email_sent_at`,
-- `push_sent_at`, `sent_at` sau `doc_type`, adică să-și falsifice propriul
-- istoric de alerte.
--
-- push_clicked_at / push_dismissed_at RĂMÂN scriibile: /api/push/clicked și
-- /api/push/dismissed le scriu cu clientul autentificat al userului, nu cu
-- service_role. Dacă le-aș fi exclus, aș fi rupt tracking-ul de push.
-- ---------------------------------------------------------------------------
revoke update on public.notifications_log from anon, authenticated;
grant update (read_at, push_clicked_at, push_dismissed_at)
  on public.notifications_log to authenticated;

-- ---------------------------------------------------------------------------
-- Escaladare de privilegii pe abonament — întărirea protecției din D-019.
--
-- Două probleme separate:
--   1. Revoke-urile de UPDATE din 20260917100000 sunt probabil fără efect
--      (vezi nota centrală). Rescrise ca allow-list.
--   2. Nimic nu restrângea INSERT-ul pe vehicles.paid_until. Policy-ul
--      `vehicles_insert_admin` cere doar să fii admin al spațiului, deci un
--      utilizator putea crea un vehicul cu paid_until = '2099-01-01' direct
--      pe REST și își acorda Premium pe viață. Gaura exista independent de
--      discuția despre privilegii pe coloane.
-- ---------------------------------------------------------------------------
revoke update, insert on public.vehicles from anon, authenticated;
-- Ce poate scrie clientul: datele mașinii + soft-delete. Nu: paid_until,
-- plate_normalized (o pune triggerul), space_id (mutarea între spații),
-- id, created_at.
grant insert (space_id, plate, vin, model, is_truck) on public.vehicles to authenticated;
grant update (plate, vin, model, is_truck, deleted_at) on public.vehicles to authenticated;

revoke update, insert on public.spaces from anon, authenticated;
-- kind și owner_id sunt scriibile la INSERT fiindcă policy-ul
-- `spaces_insert_own` le constrânge deja (kind = 'fleet', owner_id =
-- auth.uid()). La UPDATE nu sunt: altfel un admin ar putea converti o flotă
-- în spațiu personal sau muta proprietatea.
grant insert (kind, name, owner_id, cui) on public.spaces to authenticated;
grant update (name, cui) on public.spaces to authenticated;

-- ---------------------------------------------------------------------------
-- FIX 4. Un admin de flotă putea scoate ownerul din propriul spațiu.
--
-- `memberships_delete_admin_or_self` permitea ștergerea oricărui membership,
-- inclusiv al ownerului. Ownerul pierdea `is_space_member`, deci nu mai putea
-- citi spațiul — blocat în afara propriei flote (putea încă să o șteargă,
-- fiindcă `spaces_delete_owner` se uită la spaces.owner_id, nu la rol).
--
-- Helper SECURITY DEFINER în loc de subinterogare directă: un `select
-- owner_id from spaces` scris în policy ar fi trecut prin RLS-ul lui spaces,
-- deci ar fi depins de vizibilitatea rândului pentru cel care șterge.
-- ---------------------------------------------------------------------------
create or replace function public.space_owner_id(target_space_id uuid)
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select owner_id from public.spaces where id = target_space_id;
$$;

drop policy if exists "memberships_delete_admin_or_self" on public.memberships;

-- Efect secundar acceptat: nici ownerul nu-și mai poate șterge propriul
-- membership (nu mai poate „părăsi" un spațiu pe care îl deține). Corect —
-- altfel rămânea un spațiu fără niciun membru care să-l administreze.
-- Calea de ieșire pentru owner e ștergerea spațiului.
create policy "memberships_delete_admin_or_self" on public.memberships
  for delete using (
    (public.is_space_admin(space_id) or user_id = auth.uid())
    and user_id <> public.space_owner_id(space_id)
  );

-- ---------------------------------------------------------------------------
-- FIX 5. Redenumirea plăcuței ocolea anti-abuzul de trial.
--
-- `enforce_vehicle_subscription_rules` verifica plate_trials doar la INSERT.
-- Triggerul de UPDATE doar recalcula plate_normalized, fără verificare: puteai
-- adăuga plăcuța A (consumând trialul lui A), apoi o redenumeai în B și
-- obțineai acoperire gratuită pe B, cu plate_trials conținând doar A.
--
-- Devine SECURITY DEFINER pentru că acum scrie în plate_trials, tabel cu RLS
-- activat și zero policies.
-- ---------------------------------------------------------------------------
create or replace function public.sync_vehicle_plate_normalized()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_new text;
  v_status text;
begin
  v_new := public.normalize_plate(new.plate);

  if v_new = '' then
    raise exception 'plate_invalid' using errcode = 'check_violation';
  end if;

  new.plate_normalized := v_new;

  -- Corectare cosmetică („B 12 ABC" → „B-12-ABC"): aceeași plăcuță
  -- normalizată, deci nimic de verificat și nimic de consumat.
  if v_new = old.plate_normalized then
    return new;
  end if;

  select subscription_status into v_status
    from public.spaces
   where id = new.space_id;

  -- Doar spațiile în trial consumă plăcuțe. Unul cu 'active' a plătit, deci
  -- poate folosi orice plăcuță — aceeași regulă ca la INSERT.
  if v_status = 'trialing' then
    if exists (
      select 1 from public.plate_trials where plate_normalized = v_new
    ) then
      raise exception 'plate_trial_already_used' using errcode = 'check_violation';
    end if;

    -- Plăcuța nouă consumă trial. Cea veche NU se eliberează: altfel
    -- redenumirea în cerc ar da trial nelimitat, exact abuzul pe care
    -- plate_trials trebuie să-l prevină.
    insert into public.plate_trials (plate_normalized, first_space_id)
    values (v_new, new.space_id);
  end if;

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- FIX 6. Policy-urile admin pe vehicles/vehicle_docs au dispărut.
--
-- Create în 20260817120000, apoi pierdute când 20260917100000 a făcut
-- `drop table ... cascade` pe ambele tabele și a recreat doar policy-urile
-- bazate pe membership. Efect: /admin/vehicles/[id] primea null pentru
-- vehiculul altui utilizator și cădea pe notFound(), iar acțiunile din
-- adminVehicles.ts eșuau la scriere. Eșua închis, deci nu era o breșă — dar
-- panoul era rupt.
--
-- Emailul e hardcodat, la fel ca în restul proiectului (ADMIN_EMAIL în
-- src/lib/constants.ts). A treia copie a aceleiași adrese — de ținut sincron.
--
-- Recreez exact cele patru policy-uri originale, adică strict ce folosește
-- codul: citire pe vehicles, citire + scriere pe vehicle_docs. Deliberat FĂRĂ
-- UPDATE pe vehicles: nicio rută de admin nu modifică vehiculul în sine, iar
-- un drept de scriere nefolosit pe un rol definit de un email hardcodat e
-- suprafață de atac degeaba.
-- ---------------------------------------------------------------------------
drop policy if exists "vehicles_select_admin" on public.vehicles;
create policy "vehicles_select_admin" on public.vehicles
  for select
  using ((auth.jwt() ->> 'email') = 'ionut.gighileanu@gmail.com');

drop policy if exists "vehicle_docs_select_admin" on public.vehicle_docs;
create policy "vehicle_docs_select_admin" on public.vehicle_docs
  for select
  using ((auth.jwt() ->> 'email') = 'ionut.gighileanu@gmail.com');

drop policy if exists "vehicle_docs_insert_admin" on public.vehicle_docs;
create policy "vehicle_docs_insert_admin" on public.vehicle_docs
  for insert
  with check ((auth.jwt() ->> 'email') = 'ionut.gighileanu@gmail.com');

drop policy if exists "vehicle_docs_update_admin" on public.vehicle_docs;
create policy "vehicle_docs_update_admin" on public.vehicle_docs
  for update
  using ((auth.jwt() ->> 'email') = 'ionut.gighileanu@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'ionut.gighileanu@gmail.com');

-- Panoul de admin scrie vehicle_docs cu clientul autentificat, nu cu
-- service_role, deci are nevoie și de privilegii de coloană pe acest tabel.
-- vehicle_docs nu a fost atins de revoke-urile de mai sus, deci grant-ul
-- implicit Supabase acoperă deja cazul — nimic de adăugat aici.
