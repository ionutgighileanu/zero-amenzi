-- Re-audit după cele 8 puncte: gap-uri la nivel de bază de date.
--
-- Concluzia re-auditului: schemele Zod din src/lib/validation/ protejează
-- doar calea prin Server Actions. Cheia anon e publică (NEXT_PUBLIC_*), deci
-- oricine poate face POST direct la REST-ul Supabase și ocolește complet
-- codul aplicației. RLS decide CINE scrie; nimic nu decidea CE FORMĂ are ce
-- se scrie. Până acum nicio coloană text din proiect n-avea plafon în DB.
--
-- Migrarea e sigură fiindcă tabelele sunt încă goale — nu există rânduri
-- care să încalce constrângerile noi.

-- ---------------------------------------------------------------------------
-- 1. REGRESIE introdusă în 20260916100000 (digest): policy-ul de INSERT
--    public nu constrângea coloana nouă admin_notified_at. Un vizitator anonim
--    putea insera o cerere cu admin_notified_at = now(), iar cererea nu intra
--    NICIODATĂ în digest — adminul n-o vedea. Suprimare silențioasă.
-- ---------------------------------------------------------------------------
drop policy if exists "verification_requests_insert_public" on public.verification_requests;

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

-- ---------------------------------------------------------------------------
-- 2. RPC-ul attach_verification_email e SECURITY DEFINER și apelabil de anon.
--    Zod-ul din acțiune e ocolibil apelând RPC-ul direct; p_email intra în DB
--    nemărginit și nevalidat, apoi devenea destinatarul din Resend.
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- 3. Plafoane de lungime pe TOATE coloanele text scriibile de clienți.
--    Oglindesc FIELD_MAX_LENGTH și restul limitelor din src/lib/constants.ts;
--    Postgres nu poate importa constantele, deci se țin sincron manual.
-- ---------------------------------------------------------------------------

-- Tabelul anon-inserabil — cel mai expus. Plăcuța aici e RO strictă
-- (forma canonică are max 10 caractere), emailul e RFC 5321.
alter table public.verification_requests
  add constraint verification_requests_plate_len check (char_length(plate_number) between 1 and 15),
  add constraint verification_requests_email_len check (email is null or char_length(email) <= 254);

-- Vehicule: plăcuța acceptă și numere străine, deci plafon mai larg.
alter table public.vehicles
  add constraint vehicles_plate_len check (char_length(plate) between 1 and 32),
  add constraint vehicles_vin_len   check (char_length(vin) between 1 and 32),
  add constraint vehicles_model_len check (model is null or char_length(model) <= 120);

alter table public.vehicle_docs
  add constraint vehicle_docs_type_len check (char_length(type) between 1 and 60);

alter table public.drivers
  add constraint drivers_name_len  check (char_length(name) between 1 and 120),
  add constraint drivers_phone_len check (char_length(phone) between 1 and 32);

alter table public.driver_certs
  add constraint driver_certs_type_len check (char_length(type) between 1 and 60);

alter table public.organizations
  add constraint organizations_name_len check (char_length(name) between 1 and 200),
  add constraint organizations_cui_len  check (cui is null or char_length(cui) <= 20);

alter table public.alert_types
  add constraint alert_types_name_len check (char_length(name) between 1 and 60);

-- Cheile de push: p256dh real are ~88 caractere base64url, auth ~24.
-- Endpoint-ul are deja allow-list de host (20260916110000); aici doar lungimea.
alter table public.push_subscriptions
  add constraint push_subscriptions_endpoint_len check (char_length(endpoint) <= 2048),
  add constraint push_subscriptions_p256dh_len   check (char_length(p256dh) between 1 and 256),
  add constraint push_subscriptions_auth_len     check (char_length(auth) between 1 and 256);
