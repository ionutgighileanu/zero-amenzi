-- Plafon de trial: un singur vehicul gratuit per spațiu (D-024).
--
-- Inversează parțial D-019, care stabilise „vehicule nelimitate în trial".
-- Modelul nou: primul vehicul e gratuit un an, al doilea se plătește imediat,
-- indiferent cât a mai rămas din trial. Identic la B2C și B2B.
--
-- Fără schimbare de schemă — doar corpul funcției. `create or replace` face
-- migrația idempotentă prin natură, iar triggerul care o apelează rămâne
-- legat de aceeași funcție, deci nu trebuie recreat.
--
-- Ce se numără: vehiculele NEPLĂTITE ale spațiului, INCLUSIV cele cu
-- `deleted_at` setat. Ambele detalii sunt reguli de produs, nu accidente:
--   * soft-deleted intră în numărătoare pentru că trialul se consumă la
--     adăugare, nu se eliberează prin ștergere — altfel ciclul
--     adaugă/șterge/adaugă ar da vehicule gratuite la infinit;
--   * un vehicul plătit iese din numărătoare, fiindcă plafonul e pe trial,
--     nu pe mărimea garajului. Cine plătește nu trebuie penalizat.
--
-- CONDIȚIE DE CURSĂ, acceptată deliberat: `count(*)` într-un trigger
-- BEFORE INSERT nu e atomic, deci două inserturi simultane pot vedea ambele
-- zero și trece amândouă. Consecința maximă e un vehicul gratuit în plus,
-- pe un spațiu, o singură dată. Alternativa curată — index unic parțial pe
-- (space_id) where paid_until is null — ar fi prea strictă: ar interzice și
-- vehiculele neplătite din spațiile 'active', care sunt legitime (se adaugă
-- blocate, până la plată). Nu merită.

create or replace function public.enforce_vehicle_subscription_rules()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text;
  v_trial_ends timestamptz;
  v_unpaid_count integer;
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

    -- Plafonul de trial (D-024). Vezi nota din capul migrației pentru ce se
    -- numără și de ce.
    select count(*)
      into v_unpaid_count
      from public.vehicles
     where space_id = new.space_id
       and (paid_until is null or paid_until <= now());

    if v_unpaid_count >= 1 then
      raise exception 'trial_vehicle_limit' using errcode = 'check_violation';
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
