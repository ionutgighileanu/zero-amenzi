-- Backfill spații personale pentru conturile create înainte de D-019.
--
-- Migrația 20260917100000 presupunea bază goală și crease spațiul personal
-- doar prin triggerul de signup (handle_new_user), care rulează la INSERT pe
-- auth.users. Conturile deja existente în public.users la momentul migrării
-- n-au trecut prin acel INSERT, deci au rămas fără rând în `spaces` — efect
-- observat: /app/garage redirecta spre /app/organizations/new (vezi
-- src/lib/spaces.ts, fetchPersonalSpace).
--
-- Triggerul on_space_created de pe `spaces` creează automat membership-ul
-- (owner) la fiecare insert, deci nu trebuie dublat aici.
insert into public.spaces (kind, name, owner_id)
select 'personal', 'Garajul meu', u.id
from public.users u
where not exists (
  select 1 from public.spaces s
  where s.owner_id = u.id and s.kind = 'personal'
);
