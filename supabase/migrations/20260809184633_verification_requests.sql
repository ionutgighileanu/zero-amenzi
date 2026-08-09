-- Verificare publică (wizard-of-oz) — vezi PRD §5.1, D-010, D-011.
-- Un utilizator anonim cere verificarea unui număr; un admin completează
-- manual rezultatul din surse oficiale (RAR/ASF/CNAIR — nu avem încă API).

create table public.verification_requests (
  id uuid primary key default gen_random_uuid(),
  plate_number text not null,
  email text,
  status text not null default 'pending' check (status in ('pending', 'completed')),
  result_itp text check (result_itp in ('valid', 'expirat', 'nu_gasit')),
  result_rca text check (result_rca in ('valid', 'expirat', 'nu_gasit')),
  result_rovinieta text check (result_rovinieta in ('valid', 'expirat', 'nu_gasit')),
  result_itp_expires date,
  result_rca_expires date,
  result_rovinieta_expires date,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  token uuid not null default gen_random_uuid()
);

create unique index verification_requests_token_idx on public.verification_requests (token);
create index verification_requests_status_created_idx on public.verification_requests (status, created_at);

alter table public.verification_requests enable row level security;

-- ---------------------------------------------------------------------------
-- INSERT — public, fără cont. „with check" blochează forjarea unui rezultat
-- direct la creare (un client anonim nu poate insera status='completed' sau
-- rezultate gata completate — doar cererea goală, în starea 'pending').
-- ---------------------------------------------------------------------------
create policy "verification_requests_insert_public" on public.verification_requests
  for insert
  with check (
    status = 'pending'
    and result_itp is null and result_rca is null and result_rovinieta is null
    and result_itp_expires is null and result_rca_expires is null and result_rovinieta_expires is null
    and completed_at is null
  );

-- ---------------------------------------------------------------------------
-- SELECT/UPDATE — doar admin (email hardcodat, MVP — vezi src/lib/constants.ts
-- ADMIN_EMAIL). Nu există policy publică de SELECT: „acces prin token" pentru
-- pagina /verificare/[token] se face din Server Component, cu clientul
-- service_role (vezi src/lib/supabase/admin.ts), gate-uit de faptul că
-- tokenul (UUID neghicibil) trebuie cunoscut ca să apară în URL. O policy
-- RLS de forma `using (true)` ar permite oricui cu cheia anon să listeze
-- TOATE cererile (plăcuțe + email-uri) fără să filtreze după token — RLS nu
-- poate impune „doar dacă interogarea a filtrat după token", deci varianta
-- sigură e să nu deschidem deloc SELECT public pe tabelă.
-- ---------------------------------------------------------------------------
create policy "verification_requests_select_admin" on public.verification_requests
  for select
  using ((auth.jwt() ->> 'email') = 'ionut.gighileanu@gmail.com');

create policy "verification_requests_update_admin" on public.verification_requests
  for update
  using ((auth.jwt() ->> 'email') = 'ionut.gighileanu@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'ionut.gighileanu@gmail.com');

-- ---------------------------------------------------------------------------
-- attach_verification_email — Ecranul 2 (modal) cere emailul DUPĂ ce cererea
-- a fost deja creată la Ecranul 1 (doar cu plăcuța). Actualizarea normală e
-- admin-only, deci un anonim nu poate face UPDATE direct; funcția asta
-- SECURITY DEFINER face exact o singură mutație îngustă și sigură: setează
-- emailul, doar dacă tokenul se potrivește, cererea e încă 'pending' și nu
-- are deja un email — nu poate suprascrie sau „fura" cererea altcuiva.
-- ---------------------------------------------------------------------------
create function public.attach_verification_email(p_token uuid, p_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.verification_requests
  set email = nullif(trim(p_email), '')
  where token = p_token
    and status = 'pending'
    and email is null;
end;
$$;

grant execute on function public.attach_verification_email(uuid, text) to anon, authenticated;
