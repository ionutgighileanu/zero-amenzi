-- Digest de cereri noi de verificare (F-02).
--
-- Înainte, fiecare cerere publică trimitea imediat un email către admin. Cu
-- plafonul Resend de 100 email-uri/zi pe planul gratuit (vezi EMAIL_DAILY_LIMIT
-- în src/lib/constants.ts), ~100 de cereri automate epuizau cota zilnică, iar
-- alertele de expirare ale utilizatorilor reali nu mai plecau în ziua aceea.
--
-- Acum notificarea se grupează: un cron rulează periodic, ia cererile care n-au
-- fost încă anunțate și trimite UN singur email cu toate. Coloana de mai jos e
-- ce face gruparea idempotentă — o cerere apare într-un singur digest, chiar
-- dacă cronul se reia sau rulează de două ori.

alter table public.verification_requests
  add column if not exists admin_notified_at timestamptz;

-- Index parțial: cronul caută exact rândurile neanunțate, care sunt puține și
-- de scurtă durată. Un index pe toată coloana ar crește degeaba odată cu
-- istoricul de cereri deja procesate.
create index if not exists verification_requests_pending_digest_idx
  on public.verification_requests (created_at)
  where admin_notified_at is null;

comment on column public.verification_requests.admin_notified_at is
  'Momentul în care cererea a intrat într-un digest trimis adminului. NULL = încă neanunțată. Scris doar de cronul de digest, cu service_role.';
