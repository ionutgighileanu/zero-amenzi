-- Allow-list pe endpoint-ul de push, și la nivel de bază de date (F-04).
--
-- Verificarea din src/lib/push/allowed-endpoints.ts prinde tot ce trece prin
-- /api/push/subscribe — care e azi singurul loc din cod care scrie în acest
-- tabel. Constrângerea de mai jos face ca regula să nu depindă de asta
-- rămânând adevărat: dacă apare vreodată un al doilea punct de scriere
-- (migrare de date, unealtă de admin, bug), Postgres respinge inserția
-- indiferent de cod, nu doar aplicația.
--
-- Trebuie ținută sincron manual cu ALLOWED_PUSH_HOSTS din
-- src/lib/push/allowed-endpoints.ts — Postgres nu poate importa constanta TS.

alter table public.push_subscriptions
  add constraint push_subscriptions_endpoint_allowed
  check (
    endpoint like 'https://fcm.googleapis.com/%'
    or endpoint like 'https://%.fcm.googleapis.com/%'
    or endpoint like 'https://updates.push.services.mozilla.com/%'
    or endpoint like 'https://%.updates.push.services.mozilla.com/%'
    or endpoint like 'https://web.push.apple.com/%'
    or endpoint like 'https://%.web.push.apple.com/%'
  );
