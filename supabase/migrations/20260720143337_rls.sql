-- RLS pe toate tabelele (vezi CLAUDE.md: "RLS activat pe toate tabelele
-- Supabase — niciodată bypass fără motiv explicit").

alter table public.users enable row level security;
alter table public.organizations enable row level security;
alter table public.memberships enable row level security;
alter table public.vehicles enable row level security;
alter table public.vehicle_docs enable row level security;
alter table public.drivers enable row level security;
alter table public.driver_certs enable row level security;
alter table public.alert_types enable row level security;
alter table public.notifications_log enable row level security;

-- ---------------------------------------------------------------------------
-- users — fiecare vede și își editează doar propriul profil.
-- Insertul se face exclusiv prin trigger-ul handle_new_user (SECURITY DEFINER).
-- ---------------------------------------------------------------------------
create policy "users_select_own" on public.users
  for select using (id = auth.uid());

create policy "users_update_own" on public.users
  for update using (id = auth.uid());

-- ---------------------------------------------------------------------------
-- organizations — vizibile membrilor; create de orice user autentificat
-- (devine owner); update/delete doar owner.
-- ---------------------------------------------------------------------------
create policy "organizations_select_member" on public.organizations
  for select using (public.is_org_member(id));

create policy "organizations_insert_self" on public.organizations
  for insert with check (owner_id = auth.uid());

create policy "organizations_update_owner" on public.organizations
  for update using (owner_id = auth.uid());

create policy "organizations_delete_owner" on public.organizations
  for delete using (owner_id = auth.uid());

-- ---------------------------------------------------------------------------
-- memberships — membrii unei organizații se văd între ei; owner/admin
-- gestionează echipa; orice membru se poate elimina singur (leave org).
-- ---------------------------------------------------------------------------
create policy "memberships_select_same_org" on public.memberships
  for select using (public.is_org_member(org_id));

create policy "memberships_insert_admin" on public.memberships
  for insert with check (public.is_org_admin(org_id));

create policy "memberships_update_admin" on public.memberships
  for update using (public.is_org_admin(org_id));

create policy "memberships_delete_admin_or_self" on public.memberships
  for delete using (public.is_org_admin(org_id) or user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- vehicles — personale (owner_id) sau de flotă (org_id, membership necesar).
-- Scriere: proprietarul personal, sau owner/admin de flotă.
-- ---------------------------------------------------------------------------
create policy "vehicles_select_own_or_org" on public.vehicles
  for select using (
    owner_id = auth.uid() or public.is_org_member(org_id)
  );

create policy "vehicles_insert_own_or_org_admin" on public.vehicles
  for insert with check (
    owner_id = auth.uid() or public.is_org_admin(org_id)
  );

create policy "vehicles_update_own_or_org_admin" on public.vehicles
  for update using (
    owner_id = auth.uid() or public.is_org_admin(org_id)
  );

create policy "vehicles_delete_own_or_org_admin" on public.vehicles
  for delete using (
    owner_id = auth.uid() or public.is_org_admin(org_id)
  );

-- ---------------------------------------------------------------------------
-- vehicle_docs — accesul derivă din vehiculul părinte.
-- ---------------------------------------------------------------------------
create policy "vehicle_docs_select_via_vehicle" on public.vehicle_docs
  for select using (
    exists (
      select 1 from public.vehicles v
      where v.id = vehicle_docs.vehicle_id
        and (v.owner_id = auth.uid() or public.is_org_member(v.org_id))
    )
  );

create policy "vehicle_docs_write_via_vehicle" on public.vehicle_docs
  for all using (
    exists (
      select 1 from public.vehicles v
      where v.id = vehicle_docs.vehicle_id
        and (v.owner_id = auth.uid() or public.is_org_admin(v.org_id))
    )
  ) with check (
    exists (
      select 1 from public.vehicles v
      where v.id = vehicle_docs.vehicle_id
        and (v.owner_id = auth.uid() or public.is_org_admin(v.org_id))
    )
  );

-- ---------------------------------------------------------------------------
-- drivers — doar B2B, vizibili membrilor flotei; scriere owner/admin.
-- ---------------------------------------------------------------------------
create policy "drivers_select_org_member" on public.drivers
  for select using (public.is_org_member(org_id));

create policy "drivers_write_org_admin" on public.drivers
  for all using (public.is_org_admin(org_id))
  with check (public.is_org_admin(org_id));

-- ---------------------------------------------------------------------------
-- driver_certs — accesul derivă din șoferul părinte.
-- ---------------------------------------------------------------------------
create policy "driver_certs_select_via_driver" on public.driver_certs
  for select using (
    exists (
      select 1 from public.drivers d
      where d.id = driver_certs.driver_id and public.is_org_member(d.org_id)
    )
  );

create policy "driver_certs_write_via_driver" on public.driver_certs
  for all using (
    exists (
      select 1 from public.drivers d
      where d.id = driver_certs.driver_id and public.is_org_admin(d.org_id)
    )
  ) with check (
    exists (
      select 1 from public.drivers d
      where d.id = driver_certs.driver_id and public.is_org_admin(d.org_id)
    )
  );

-- ---------------------------------------------------------------------------
-- alert_types — personale (owner_id) sau de flotă (org_id).
-- ---------------------------------------------------------------------------
create policy "alert_types_select_own_or_org" on public.alert_types
  for select using (
    owner_id = auth.uid() or public.is_org_member(org_id)
  );

create policy "alert_types_write_own_or_org_admin" on public.alert_types
  for all using (
    owner_id = auth.uid() or public.is_org_admin(org_id)
  ) with check (
    owner_id = auth.uid() or public.is_org_admin(org_id)
  );

-- ---------------------------------------------------------------------------
-- notifications_log — doar citire de către proprietarul notificării.
-- Scrierea se face exclusiv din server (service role), care ocolește RLS
-- prin design — niciun client autentificat nu poate insera direct.
-- ---------------------------------------------------------------------------
create policy "notifications_log_select_own" on public.notifications_log
  for select using (user_id = auth.uid());
