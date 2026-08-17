-- Acces admin (email hardcodat, MVP) la vehicles/vehicle_docs — permite
-- panoului de administrare (/admin/vehicles/[id]) să citească și să scrie
-- documentele oricărui vehicul, nu doar ale propriului cont. Oglindește
-- exact politicile admin de pe verification_requests — vezi
-- 20260809184633_verification_requests.sql. Emailul e mirror-uit în
-- src/lib/constants.ts (ADMIN_EMAIL) — ține-le sincronizate dacă se schimbă.

create policy "vehicles_select_admin" on public.vehicles
  for select
  using ((auth.jwt() ->> 'email') = 'ionut.gighileanu@gmail.com');

create policy "vehicle_docs_select_admin" on public.vehicle_docs
  for select
  using ((auth.jwt() ->> 'email') = 'ionut.gighileanu@gmail.com');

create policy "vehicle_docs_insert_admin" on public.vehicle_docs
  for insert
  with check ((auth.jwt() ->> 'email') = 'ionut.gighileanu@gmail.com');

create policy "vehicle_docs_update_admin" on public.vehicle_docs
  for update
  using ((auth.jwt() ->> 'email') = 'ionut.gighileanu@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'ionut.gighileanu@gmail.com');
