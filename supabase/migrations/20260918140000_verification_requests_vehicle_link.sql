-- Verificarea vehiculelor din garaj/flotă trece prin fluxul wizard-of-oz
-- (D-023). Până acum, adăugarea unui vehicul inventa trei date de expirare
-- cu offset-uri fixe și le afișa ca fapt — buline verzi, „toate documentele
-- sunt în regulă" — fără ca nimeni să fi verificat nimic. De acum vehiculul
-- creează o cerere de verificare, iar datele reale ajung pe card când adminul
-- o completează.

-- Legătura cerere → vehicul. Nullable: cererile publice (fără cont) rămân
-- nelegate, ca până acum.
alter table public.verification_requests
  add column if not exists vehicle_id uuid references public.vehicles (id) on delete cascade;

create index if not exists verification_requests_vehicle_id_idx
  on public.verification_requests (vehicle_id)
  where vehicle_id is not null;

-- Plăcuțele de vehicul acceptă și numere străine (până la 32), spre deosebire
-- de verificarea publică, care e strict RO. Limita veche de 15 ar fi respins
-- cererea creată pentru un camion înmatriculat în afara țării.
alter table public.verification_requests drop constraint if exists verification_requests_plate_len;
alter table public.verification_requests
  add constraint verification_requests_plate_len check (char_length(plate_number) between 1 and 32);

-- INSERT: un client poate lega cererea doar de un vehicul dintr-un spațiu pe
-- care îl administrează — aceeași regulă ca la crearea vehiculului. Fără
-- condiția asta, oricine ar putea ataşa o cerere vehiculului altcuiva, iar
-- la completare i-ar suprascrie documentele.
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
    and (
      vehicle_id is null
      or exists (
        select 1 from public.vehicles v
        where v.id = vehicle_id and public.is_space_admin(v.space_id)
      )
    )
  );

-- SELECT pentru membri: garajul și flota trebuie să știe care vehicule sunt
-- încă „în verificare". Scopul e restrâns la vehiculele spațiilor proprii —
-- nu deschide listarea cererilor publice, care rămâne admin-only.
drop policy if exists "verification_requests_select_space_member" on public.verification_requests;
create policy "verification_requests_select_space_member" on public.verification_requests
  for select
  using (
    vehicle_id is not null
    and exists (
      select 1 from public.vehicles v
      where v.id = vehicle_id and public.is_space_member(v.space_id)
    )
  );
