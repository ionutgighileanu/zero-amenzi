/**
 * Escapare HTML pentru orice conținut interpolat în șabloanele de email.
 *
 * Șabloanele din acest director construiesc HTML prin template literals, deci
 * nu beneficiază de escaparea automată pe care o face React în componente.
 * Fără asta, un câmp controlat de utilizator (plăcuța dintr-o cerere publică,
 * tipul de document „Alt tip") ajunge ca marcaj în inbox — vezi F-01 din audit.
 *
 * Se aplică DOAR pe corpul HTML. Subiectul emailului e un header de text
 * simplu: escapat acolo, `&` ar apărea literal ca `&amp;` în inbox.
 */
export function escapeHtml(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
