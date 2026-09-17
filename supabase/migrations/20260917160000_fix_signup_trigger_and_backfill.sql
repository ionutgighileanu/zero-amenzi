-- Fix P0: triggerul on_auth_user_created lipsea din producție (drift în afara
-- migrațiilor — nicio migrație din istoric nu-l dropează explicit). Funcția
-- handle_new_user() exista și fusese chiar actualizată de D-019, dar nimic
-- n-o mai declanșa la INSERT pe auth.users.
--
-- Efect real: NICIUN cont, vechi sau nou, nu avea rând în public.users, deci
-- nici în public.spaces. Migrația de backfill anterioară (20260917150000)
-- n-a inserat nimic din acest motiv exact — public.users era complet gol.
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill public.users pentru conturile auth care n-au trecut niciodată
-- prin trigger.
insert into public.users (id, email)
select a.id, a.email
from auth.users a
where not exists (select 1 from public.users u where u.id = a.id);

-- Backfill spații personale pentru userii de mai sus (20260917150000 rulase
-- pe un public.users gol, deci n-a avut ce insera).
insert into public.spaces (kind, name, owner_id)
select 'personal', 'Garajul meu', u.id
from public.users u
where not exists (
  select 1 from public.spaces s
  where s.owner_id = u.id and s.kind = 'personal'
);
