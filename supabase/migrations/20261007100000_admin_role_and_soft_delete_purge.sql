-- D-032 · Rolul de admin în app_metadata + curățarea datelor soft-deleted.
--
-- Două schimbări independente, în aceeași migrație fiindcă ambele ating
-- regulile de acces/retenție și se aplică împreună.

-- ===========================================================================
-- 1. ADMIN: din „emailul X" în „rolul admin din app_metadata".
--
-- Până acum, admin era oricine avea în JWT emailul ionut.gighileanu@gmail.com
-- — scris de mână în 6 policy-uri și 3 verificări din cod. Dacă adresa ajunge
-- vreodată pe alt cont (cont șters și recreat de altcineva, confirmarea de
-- email oprită), contul acela devine admin peste toate datele.
--
-- `app_metadata` (raw_app_meta_data) poate fi scris DOAR server-side, cu
-- service_role. Spre deosebire de `user_metadata`, utilizatorul nu și-l poate
-- modifica singur din browser, deci e locul corect pentru un rol.
--
-- ATENȚIE: rolul intră în JWT abia la emiterea unui token nou. După aplicare,
-- adminul trebuie să se delogheze și să se logheze o dată.
-- ===========================================================================

-- Acordarea rolului. Dacă contul nu există, oprim migrația: altfel policy-urile
-- de mai jos ar trece pe rol fără ca vreun cont să-l aibă, iar panoul de admin
-- ar rămâne fără niciun admin.
do $$
begin
  update auth.users
     set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb
   where email = 'ionut.gighileanu@gmail.com';

  if not found then
    raise exception 'Contul de admin nu există — refuz să mut policy-urile pe rol fără niciun admin.';
  end if;
end $$;

create or replace function public.is_app_admin()
returns boolean
language sql
stable
set search_path = public
as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin';
$$;

comment on function public.is_app_admin() is
  'Adevărat dacă JWT-ul curent are app_metadata.role = admin. Singura sursă a rolului de admin în policy-uri (D-032).';

-- Cele 6 policy-uri de admin, recreate identic ca formă, doar cu condiția
-- schimbată din email în rol.
drop policy if exists "verification_requests_select_admin" on public.verification_requests;
create policy "verification_requests_select_admin" on public.verification_requests
  for select
  using (public.is_app_admin());

drop policy if exists "verification_requests_update_admin" on public.verification_requests;
create policy "verification_requests_update_admin" on public.verification_requests
  for update
  using (public.is_app_admin())
  with check (public.is_app_admin());

drop policy if exists "vehicles_select_admin" on public.vehicles;
create policy "vehicles_select_admin" on public.vehicles
  for select
  using (public.is_app_admin());

drop policy if exists "vehicle_docs_select_admin" on public.vehicle_docs;
create policy "vehicle_docs_select_admin" on public.vehicle_docs
  for select
  using (public.is_app_admin());

drop policy if exists "vehicle_docs_insert_admin" on public.vehicle_docs;
create policy "vehicle_docs_insert_admin" on public.vehicle_docs
  for insert
  with check (public.is_app_admin());

drop policy if exists "vehicle_docs_update_admin" on public.vehicle_docs;
create policy "vehicle_docs_update_admin" on public.vehicle_docs
  for update
  using (public.is_app_admin())
  with check (public.is_app_admin());

-- ===========================================================================
-- 2. CURĂȚAREA DATELOR SOFT-DELETED (GDPR: ștergere + limitarea stocării).
--
-- „Șterge" din aplicație setează doar deleted_at; rândul rămânea pentru
-- totdeauna. După 30 de zile:
--   - ȘOFERII se șterg definitiv (nume + telefon ale unei terțe persoane).
--     driver_certs și notifications_log cad prin `on delete cascade`.
--   - VEHICULELE se ANONIMIZEAZĂ, nu se șterg: plafonul de trial (D-024)
--     numără vehiculele neplătite INCLUSIV cele șterse. Ștergerea definitivă
--     ar permite „șterg mașina gratuită, aștept 30 de zile, adaug alta tot
--     gratis". Rândul rămâne ca „a existat un vehicul neplătit aici", fără
--     plăcuță, VIN sau model; documentele, cererile de verificare (plăcuță +
--     email) și istoricul alertelor lui se șterg definitiv.
--
-- plate_trials NU se atinge: păstrează plăcuțele care au folosit trialul,
-- ca aceeași mașină să nu primească al doilea trial (anti-abuz, declarat în
-- politica de confidențialitate ca interes legitim).
-- ===========================================================================

-- Triggerul de schimbare a plăcuței verifică și consumă plate_trials la orice
-- redenumire într-un spațiu în trial. Fără excepția de mai jos, anonimizarea
-- ar scrie „STERS" în plate_trials la primul vehicul, apoi ar pica cu
-- plate_trial_already_used la al doilea din orice spațiu în trial.
--
-- Excepția e un flag local tranzacției, setat DOAR de purge_soft_deleted.
-- Clienții nu-l pot seta: PostgREST nu expune set_config (e în pg_catalog).
-- Restul funcției e identic cu versiunea din 20260918130000.
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

  -- Anonimizarea unui vehicul șters (D-032): nu e o plăcuță reală, nu
  -- consumă și nu verifică trial.
  if current_setting('app.purging_soft_deleted', true) = 'on'
     and old.deleted_at is not null then
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

create or replace function public.purge_soft_deleted(p_days integer default 30)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cutoff timestamptz;
  v_drivers integer;
  v_vehicle_ids uuid[];
begin
  if p_days is null or p_days < 1 then
    raise exception 'p_days trebuie să fie cel puțin 1';
  end if;
  v_cutoff := now() - make_interval(days => p_days);

  delete from public.drivers
   where deleted_at is not null
     and deleted_at < v_cutoff;
  get diagnostics v_drivers = row_count;

  -- Doar cele încă neanonimizate, ca rularea zilnică să nu le reia.
  select coalesce(array_agg(id), '{}')
    into v_vehicle_ids
    from public.vehicles
   where deleted_at is not null
     and deleted_at < v_cutoff
     and not (plate = 'STERS' and vin = '-');

  if cardinality(v_vehicle_ids) > 0 then
    delete from public.vehicle_docs where vehicle_id = any(v_vehicle_ids);
    -- Notificările in-app ale cererilor cad prin cascade pe verification_request_id.
    delete from public.verification_requests where vehicle_id = any(v_vehicle_ids);
    delete from public.notifications_log where vehicle_id = any(v_vehicle_ids);

    perform set_config('app.purging_soft_deleted', 'on', true);
    update public.vehicles
       set plate = 'STERS', vin = '-', model = null
     where id = any(v_vehicle_ids);
    perform set_config('app.purging_soft_deleted', 'off', true);
  end if;

  return jsonb_build_object(
    'drivers_deleted', v_drivers,
    'vehicles_anonymized', cardinality(v_vehicle_ids)
  );
end;
$$;

comment on function public.purge_soft_deleted(integer) is
  'Șterge definitiv șoferii și anonimizează vehiculele soft-deleted mai vechi de p_days zile (D-032). Apelată zilnic de cronul check-expiries, doar cu service_role.';

-- Doar cronul (service_role) o poate apela. Supabase dă implicit EXECUTE pe
-- funcțiile din public către anon/authenticated, deci revocarea e explicită.
revoke all on function public.purge_soft_deleted(integer) from public, anon, authenticated;
grant execute on function public.purge_soft_deleted(integer) to service_role;
