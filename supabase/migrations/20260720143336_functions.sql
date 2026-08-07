-- Funcții helper pentru RLS (SECURITY DEFINER, ca să nu creeze recursie
-- când sunt apelate din policies pe memberships/organizations) și triggere
-- pentru sincronizarea automată auth.users → public.users și owner → membership.

-- ---------------------------------------------------------------------------
-- is_org_member / is_org_admin — folosite în policies, evită recursia RLS
-- ---------------------------------------------------------------------------
create function public.is_org_member(target_org_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.memberships
    where org_id = target_org_id and user_id = auth.uid()
  );
$$;

create function public.is_org_admin(target_org_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.memberships
    where org_id = target_org_id
      and user_id = auth.uid()
      and role in ('owner', 'admin')
  );
$$;

-- ---------------------------------------------------------------------------
-- on_auth_user_created — creează rândul din public.users la fiecare signup
-- ---------------------------------------------------------------------------
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- on_organization_created — proprietarul devine automat membership 'owner'
-- ---------------------------------------------------------------------------
create function public.handle_new_organization()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.memberships (user_id, org_id, role)
  values (new.owner_id, new.id, 'owner');
  return new;
end;
$$;

create trigger on_organization_created
  after insert on public.organizations
  for each row execute function public.handle_new_organization();
