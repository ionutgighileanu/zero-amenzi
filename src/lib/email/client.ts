import { Resend } from "resend";

let client: Resend | null = null;

/** Singleton Resend, construit doar dacă RESEND_API_KEY e setat. Fără cheie,
 * apelantul primește `null` și decide să eșueze grațios (vezi send-alert.ts,
 * send-verification-result.ts) — trimiterea de email nu blochează niciodată
 * scrierea datelor, care rămâne sursa de adevăr. */
export function getResendClient(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (!client) client = new Resend(key);
  return client;
}
