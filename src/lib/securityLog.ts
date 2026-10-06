/**
 * Log structurat pentru evenimente de securitate (D-030).
 *
 * Scopul: ca „trafic neobișnuit" — rafale de login eșuat, limite de rată
 * atinse, cereri la cron fără secret — să fie VIZIBIL și căutabil în logurile
 * Vercel, nu îngropat în `console.error`-uri cu formate diferite. Un singur
 * prefix (`[sec]`) și o formă JSON constantă fac un filtru de o linie în
 * dashboard-ul Vercel sau un drain de loguri.
 *
 * NU logăm PII: fără email, fără parolă, fără conținutul cererii. IP-ul e deja
 * în logurile platformei și e necesar ca să distingem un utilizator confuz de
 * un atac distribuit, deci îl păstrăm — dar atât.
 */

export type SecurityEvent =
  | "login_failed"
  | "login_rate_limited"
  | "signup_rate_limited"
  | "password_reset_requested"
  | "password_reset_rate_limited"
  | "password_changed"
  | "cron_unauthorized";

type SecurityLogFields = {
  ip?: string;
  /** Secunde până la următoarea încercare permisă, pentru evenimentele de rată. */
  retryAfterSeconds?: number;
  /** Ce rută de cron a fost lovită fără secret valid. */
  route?: string;
};

/**
 * Scrie un eveniment de securitate. `warn` pentru lucruri care MERITĂ o
 * privire (eșecuri, limite atinse), nu `error` — nu sunt defecte ale aplicației,
 * ci semnale. Un SIEM/alerting le poate escalada după volum.
 */
export function logSecurityEvent(event: SecurityEvent, fields: SecurityLogFields = {}): void {
  console.warn(
    "[sec]",
    JSON.stringify({
      event,
      at: new Date().toISOString(),
      ...fields,
    })
  );
}
