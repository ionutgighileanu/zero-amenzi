import webpush from "web-push";
import { ADMIN_EMAIL } from "@/lib/constants";

let configured = false;

/** Configurează VAPID pe modulul `web-push` (singleton la nivel de proces),
 * doar dacă ambele chei sunt setate. Fără chei, apelantul primește `null`
 * și decide să eșueze grațios (vezi send-alert.ts) — la fel ca la Resend,
 * trimiterea de push nu blochează niciodată scrierea în notifications_log,
 * care rămâne sursa de adevăr. */
export function getWebPushClient(): typeof webpush | null {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return null;

  if (!configured) {
    webpush.setVapidDetails(`mailto:${ADMIN_EMAIL}`, publicKey, privateKey);
    configured = true;
  }
  return webpush;
}
