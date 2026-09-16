/**
 * Servicii de push cunoscute — hostname-urile la care browserele trimit
 * efectiv notificările Web Push (F-04).
 *
 * Fără asta, endpoint-ul salvat de un utilizator autentificat era orice URL
 * truthy: la fiecare alertă, serverul face o cerere HTTP către acel URL
 * (vezi src/lib/push/send-alert.ts → webpush.sendNotification), deci un
 * endpoint arbitrar transformă cronul într-un SSRF orb, țintă aleasă de
 * atacator, declanșată automat.
 *
 * Aplicația nu limitează browserul (nu există browserslist în proiect — e o
 * PWA obișnuită, instalabilă de pe orice telefon), deci lista acoperă toate
 * serviciile reale: FCM (Chrome, Edge Chromium, Samsung Internet, Opera —
 * toate bazate pe Chromium), Mozilla (Firefox) și Apple (Safari, din
 * iOS 16.4 / macOS 13). WNS (vechiul push al Edge pre-Chromium) e retras
 * din 2020 — Edge modern trimite prin FCM, la fel ca Chrome.
 *
 * Aceeași listă e aplicată și la nivel de bază de date, ca a doua linie de
 * apărare — vezi migrarea 20260916110000_push_endpoint_allowlist.sql.
 * Postgres nu poate importa constanta de aici: dacă modifici lista, schimb-o
 * și acolo.
 */
const ALLOWED_PUSH_HOSTS = [
  "fcm.googleapis.com",
  "updates.push.services.mozilla.com",
  "web.push.apple.com",
] as const;

export function isAllowedPushEndpoint(endpoint: string): boolean {
  let url: URL;
  try {
    url = new URL(endpoint);
  } catch {
    return false;
  }

  if (url.protocol !== "https:") return false;

  return ALLOWED_PUSH_HOSTS.some(
    (host) => url.hostname === host || url.hostname.endsWith(`.${host}`)
  );
}
