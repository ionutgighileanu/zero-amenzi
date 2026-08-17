export type DocStatus = "valid" | "warning" | "expired" | "none";

const DAY_MS = 86_400_000;

/** Miezul nopții de azi — bază stabilă pentru calculul zilelor rămase. */
function startOfToday(): number {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
}

export function daysUntil(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr).getTime() - startOfToday()) / DAY_MS);
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
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** Dată + oră, pentru momente punctuale (ex. când a fost trimisă o cerere
 * de verificare), spre deosebire de formatDate care e pentru zile calendaristice. */
export function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("ro-RO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
