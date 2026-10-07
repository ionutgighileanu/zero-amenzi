-- D-033 · Perioada gratuită se acordă o singură dată per email și per mașină (VIN).
--
-- Până acum singura memorie anti-abuz era plate_trials (per plăcuță). Rămâneau
-- două căi de a lua din nou anul gratuit:
--   1. cont șters → cont nou cu același email → spațiu nou cu trial proaspăt,
--      pe care se adaugă o altă mașină;
--   2. aceeași mașină (același VIN) adăugată pe alt cont cu alt număr de
--      înmatriculare.
--
-- Regulile noi:
--   * email_trials ține amprenta (SHA-256) emailului normalizat al fiecărui
--     cont. Supraviețuiește ștergerii contului. Un cont nou al cărui email a
--     aparținut unui cont anterior primește spații FĂRĂ perioadă gratuită
--     (trial_denied = true, trial_ends_at = now()).
--   * vin_trials ține VIN-urile care au primit trial. Același VIN nu mai poate
--     intra în trial, indiferent de plăcuță sau cont.
--   * Schimbarea legitimă a numărului (reînmatriculare, număr personalizat) se
--     face din meniul vehiculului, prin change_vehicle_plate — vehiculul își
--     păstrează trialul. Plafon: 2 schimbări în 12 luni per vehicul.
--     Coloanele plate și vin nu mai pot fi modificate direct de client.

-- ===========================================================================
-- 1. EMAIL
-- ===========================================================================

-- Aceeași cutie poștală scrisă altfel nu trebuie să conteze ca email nou:
-- „Ion.Pop+zero@Gmail.com" și „ionpop@gmail.com" ajung la același om.
-- +eticheta se taie la toate domeniile; punctele doar la Gmail, singurul mare
-- furnizor care le ignoră.
create or replace function public.normalize_email(p_email text)
returns text
language sql
immutable
set search_path = public
as $$
  select case
    when v.domain in ('gmail.com', 'googlemail.com')
      then replace(split_part(v.local, '+', 1), '.', '') || '@gmail.com'
    else split_part(v.local, '+', 1) || '@' || v.domain
  end
  from (
    select split_part(lower(trim(p_email)), '@', 1) as local,
           split_part(lower(trim(p_email)), '@', 2) as domain
  ) v;
$$;

-- Păstrăm amprenta, nu adresa: după ștergerea contului nu mai avem emailul în
-- clar, doar putem recunoaște aceeași adresă dacă revine.
create or replace function public.email_trial_hash(p_email text)
returns text
language sql
immutable
set search_path = public
as $$
  select encode(sha256(convert_to(public.normalize_email(p_email), 'UTF8')), 'hex');
$$;

create table public.email_trials (
  email_hash text primary key,
  -- Contul care a primit trialul cu acest email. Devine null la ștergerea
  -- contului — rândul rămâne, ca un cont NOU cu același email să fie recunoscut.
  first_user_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

comment on table public.email_trials is
  'Amprenta emailurilor care au avut cont (D-033). Un cont nou cu un email deja văzut nu primește perioadă gratuită. Scris doar de triggere.';

alter table public.email_trials enable row level security;
revoke all on public.email_trials from anon, authenticated;

alter table public.spaces
  add column trial_denied boolean not null default false;

comment on column public.spaces.trial_denied is
  'Spațiu creat fără perioadă gratuită, fiindcă emailul proprietarului a mai avut un cont (D-033).';

-- Orice spațiu nou — personalul de la signup sau o flotă creată din aplicație —
-- trece pe aici. Dacă emailul proprietarului aparține altui cont (inclusiv unul
-- șters), spațiul pornește cu trialul deja expirat.
create or replace function public.apply_space_trial_eligibility()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
  v_first_user uuid;
begin
  select email into v_email from auth.users where id = new.owner_id;
  if v_email is null then
    return new;
  end if;

  select first_user_id into v_first_user
    from public.email_trials
   where email_hash = public.email_trial_hash(v_email);

  if found and v_first_user is distinct from new.owner_id then
    new.trial_denied := true;
    new.trial_ends_at := now();
  end if;

  return new;
end;
$$;

create trigger spaces_apply_trial_eligibility
  before insert on public.spaces
  for each row execute function public.apply_space_trial_eligibility();

-- Signup: emailul se înregistrează ÎNAINTE de crearea spațiului personal.
-- `on conflict do nothing`: un email deja văzut rămâne legat de contul vechi
-- (sau de null, dacă a fost șters), deci triggerul de mai sus îl refuză.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email);

  if new.email is not null then
    insert into public.email_trials (email_hash, first_user_id)
    values (public.email_trial_hash(new.email), new.id)
    on conflict (email_hash) do nothing;
  end if;

  -- Membership-ul NU se creează aici: insertul de mai jos declanșează
  -- on_space_created, care îl face.
  insert into public.spaces (kind, name, owner_id, trial_ends_at)
  values ('personal', 'Garajul meu', new.id, now() + interval '1 year');

  return new;
end;
$$;

-- Și adresa nouă, la schimbarea emailului: altfel „schimb emailul în X, șterg
-- contul, îmi fac cont nou cu X" ar ocoli regula.
create or replace function public.handle_user_email_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.users set email = new.email where id = new.id;

  insert into public.email_trials (email_hash, first_user_id)
  values (public.email_trial_hash(new.email), new.id)
  on conflict (email_hash) do nothing;

  return new;
end;
$$;

-- Conturile existente: emailurile lor sunt deja „folosite".
insert into public.email_trials (email_hash, first_user_id)
select public.email_trial_hash(email), id
  from auth.users
 where email is not null
on conflict (email_hash) do nothing;

-- ===========================================================================
-- 2. VIN
-- ===========================================================================

create or replace function public.normalize_vin(p_vin text)
returns text
language sql
immutable
set search_path = public
as $$
  select upper(regexp_replace(coalesce(p_vin, ''), '[^A-Za-z0-9]', '', 'g'));
$$;

-- 17 caractere, fără I, O, Q (ISO 3779). Nu verificăm cifra de control: e
-- obligatorie doar în America de Nord, multe VIN-uri europene nu o respectă.
create or replace function public.is_valid_vin(p_vin text)
returns boolean
language sql
immutable
set search_path = public
as $$
  select p_vin ~ '^[A-HJ-NPR-Z0-9]{17}$';
$$;

create table public.vin_trials (
  vin_normalized text primary key,
  first_space_id uuid references public.spaces (id) on delete set null,
  created_at timestamptz not null default now()
);

comment on table public.vin_trials is
  'VIN-urile care au beneficiat de perioada gratuită (D-033). Aceeași mașină nu primește al doilea trial, nici cu alt număr, nici pe alt cont. Scris doar de triggere.';

alter table public.vin_trials enable row level security;
revoke all on public.vin_trials from anon, authenticated;

-- Mașinile care au consumat deja trialul (plăcuța lor e în plate_trials).
insert into public.vin_trials (vin_normalized, first_space_id)
select distinct on (public.normalize_vin(v.vin)) public.normalize_vin(v.vin), v.space_id
  from public.vehicles v
  join public.plate_trials p on p.plate_normalized = v.plate_normalized
 where public.is_valid_vin(public.normalize_vin(v.vin))
 order by public.normalize_vin(v.vin), v.created_at
on conflict (vin_normalized) do nothing;

-- Corpul din 20260918150000, plus: spațiu fără trial (email deja folosit),
-- VIN valid obligatoriu în trial și VIN deja folosit.
create or replace function public.enforce_vehicle_subscription_rules()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text;
  v_trial_ends timestamptz;
  v_trial_denied boolean;
  v_unpaid_count integer;
  v_vin text;
begin
  new.plate_normalized := public.normalize_plate(new.plate);

  if new.plate_normalized = '' then
    raise exception 'plate_invalid' using errcode = 'check_violation';
  end if;

  select subscription_status, trial_ends_at, trial_denied
    into v_status, v_trial_ends, v_trial_denied
    from public.spaces
   where id = new.space_id;

  if not found then
    raise exception 'space_not_found' using errcode = 'foreign_key_violation';
  end if;

  if v_status = 'expired' then
    raise exception 'space_expired' using errcode = 'check_violation';
  end if;

  if v_status = 'trialing' then
    if v_trial_denied then
      raise exception 'trial_already_used_by_email' using errcode = 'check_violation';
    end if;

    if v_trial_ends <= now() then
      raise exception 'trial_expired' using errcode = 'check_violation';
    end if;

    -- Plafonul de trial (D-024): vehiculele neplătite, inclusiv cele șterse.
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

    -- Fără VIN real, regula de mai jos s-ar ocoli scriind orice text.
    v_vin := public.normalize_vin(new.vin);
    if not public.is_valid_vin(v_vin) then
      raise exception 'vin_invalid' using errcode = 'check_violation';
    end if;

    if exists (select 1 from public.vin_trials where vin_normalized = v_vin) then
      raise exception 'vin_trial_already_used' using errcode = 'check_violation';
    end if;

    insert into public.plate_trials (plate_normalized, first_space_id)
    values (new.plate_normalized, new.space_id);

    insert into public.vin_trials (vin_normalized, first_space_id)
    values (v_vin, new.space_id);
  end if;

  return new;
end;
$$;

-- ===========================================================================
-- 3. SCHIMBAREA NUMĂRULUI DE ÎNMATRICULARE
-- ===========================================================================

-- Clientul nu mai scrie direct plate/vin: numărul se schimbă doar prin
-- change_vehicle_plate (cu plafon), iar VIN-ul e fix — e identitatea mașinii.
revoke update (plate, vin) on public.vehicles from authenticated;

create table public.plate_changes (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles (id) on delete cascade,
  changed_at timestamptz not null default now()
);

create index plate_changes_vehicle_idx on public.plate_changes (vehicle_id, changed_at);

comment on table public.plate_changes is
  'Istoricul schimbărilor de număr per vehicul, pentru plafonul anual (D-033). Fără plăcuțe stocate — doar momentul.';

alter table public.plate_changes enable row level security;
revoke all on public.plate_changes from anon, authenticated;

-- Corpul din 20261007100000, plus: un vehicul plătit își poate schimba
-- numărul fără să verifice sau să consume trial — a plătit pentru el.
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

  if v_new = old.plate_normalized then
    return new;
  end if;

  if current_setting('app.purging_soft_deleted', true) = 'on'
     and old.deleted_at is not null then
    return new;
  end if;

  if new.paid_until is not null and new.paid_until > now() then
    return new;
  end if;

  select subscription_status into v_status
    from public.spaces
   where id = new.space_id;

  if v_status = 'trialing' then
    if exists (
      select 1 from public.plate_trials where plate_normalized = v_new
    ) then
      raise exception 'plate_trial_already_used' using errcode = 'check_violation';
    end if;

    -- Numărul nou consumă trial; cel vechi NU se eliberează.
    insert into public.plate_trials (plate_normalized, first_space_id)
    values (v_new, new.space_id);
  end if;

  return new;
end;
$$;

-- ATENȚIE: plafonul (2) oglindește PLATE_CHANGES_PER_YEAR din
-- src/lib/subscription.ts — schimbă-le împreună.
create or replace function public.change_vehicle_plate(p_vehicle_id uuid, p_new_plate text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_space uuid;
  v_old text;
  v_new text;
  v_recent integer;
begin
  select space_id, plate_normalized
    into v_space, v_old
    from public.vehicles
   where id = p_vehicle_id
     and deleted_at is null
   for update;

  if not found or not public.is_space_admin(v_space) then
    raise exception 'vehicle_not_found' using errcode = 'insufficient_privilege';
  end if;

  v_new := public.normalize_plate(p_new_plate);
  if v_new = '' then
    raise exception 'plate_invalid' using errcode = 'check_violation';
  end if;
  if v_new = v_old then
    raise exception 'plate_unchanged' using errcode = 'check_violation';
  end if;

  select count(*)
    into v_recent
    from public.plate_changes
   where vehicle_id = p_vehicle_id
     and changed_at > now() - interval '1 year';

  if v_recent >= 2 then
    raise exception 'plate_change_limit' using errcode = 'check_violation';
  end if;

  -- Triggerul sync_vehicle_plate_normalized face restul: normalizare și,
  -- pentru un vehicul în trial, verificarea/consumul plăcuței noi.
  update public.vehicles set plate = p_new_plate where id = p_vehicle_id;

  insert into public.plate_changes (vehicle_id) values (p_vehicle_id);
end;
$$;

comment on function public.change_vehicle_plate(uuid, text) is
  'Schimbă numărul unui vehicul păstrându-i trialul. Maximum 2 schimbări în 12 luni per vehicul (D-033).';

revoke all on function public.change_vehicle_plate(uuid, text) from public, anon;
grant execute on function public.change_vehicle_plate(uuid, text) to authenticated;
