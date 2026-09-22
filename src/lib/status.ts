export type DocStatus = "valid" | "warning" | "expired" | "none";

const DAY_MS = 86_400_000;

/**
 * Fusul orar în care se judecă „azi". Utilizatorii sunt în România; actele
 * expiră la o dată calendaristică românească.
 *
 * Înainte, „azi" era miezul nopții LOCAL al mașinii care rula codul, iar data
 * de expirare era parsată ca miezul nopții UTC. Rezultatul depindea de unde
 * rula: în browserul din România (UTC+3) totul ieșea cu o zi în plus — un act
 * expirat ieri apărea „Expiră azi" —, în timp ce serverul Vercel (UTC) dădea
 * numărul corect. Aceeași dată, două răspunsuri, iar web-ul contrazicea
 * emailul.
 */
export const ROMANIA_TIMEZONE = "Europe/Bucharest";

const YMD_FORMATTER = new Intl.DateTimeFormat("en-CA", {
  timeZone: ROMANIA_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Data calendaristică de azi în România, ca „AAAA-LL-ZZ". */
export function todayInRomania(now: Date = new Date()): string {
  return YMD_FORMATTER.format(now);
}

/** O dată simplă („2026-09-21") rămâne așa; un timestamp se convertește la
 * ziua calendaristică din România în care cade. */
function calendarDate(value: string): string {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : YMD_FORMATTER.format(new Date(value));
}

/** Zile de la epocă, pe calendar — aritmetică exactă, fără ore sau fus orar. */
function dayNumber(ymd: string): number {
  const [y, m, d] = ymd.split("-").map(Number);
  return Date.UTC(y, m - 1, d) / DAY_MS;
}

/** Zile calendaristice rămase: 0 = expiră azi, negativ = a expirat. Același
 * rezultat în browser și pe server, oricare le-ar fi fusul orar. */
export function daysUntil(
  dateStr: string | null | undefined,
  now: Date = new Date()
): number | null {
  if (!dateStr) return null;
  return dayNumber(calendarDate(dateStr)) - dayNumber(todayInRomania(now));
}

export function getStatus(dateStr: string | null | undefined): DocStatus {
  const d = daysUntil(dateStr);
  if (d === null) return "none";
  if (d < 0) return "expired";
  if (d <= 15) return "warning";
  return "valid";
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("ro-RO", {
    timeZone: ROMANIA_TIMEZONE,
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** Zi + lună, fără an („22 sept."), pentru etichete scurte. */
export function formatDayMonth(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("ro-RO", {
    timeZone: ROMANIA_TIMEZONE,
    day: "numeric",
    month: "short",
  });
}

/** Dată + oră, pentru momente punctuale (ex. când a fost trimisă o cerere
 * de verificare), spre deosebire de formatDate care e pentru zile calendaristice. */
export function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("ro-RO", {
    timeZone: ROMANIA_TIMEZONE,
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
