import {
  PLATE_INPUT_MAX_LENGTH,
  RO_PLATE_INPUT_MAX_LENGTH,
  RO_PLATE_INPUT_REGEX,
  RO_PLATE_PARTS,
} from "@/lib/constants";

/**
 * Curăță inputul de plăcuță PE MĂSURĂ ce omul tastează: majuscule, doar
 * litere/cifre/spațiu, un singur spațiu între grupuri, plafon de lungime.
 * Blochează la sursă ce serverul ar respinge oricum, ca eroarea să nu
 * apară abia după submit. `strict` = plăcuță RO (plafon 10); altfel flotă,
 * unde acceptăm numere străine (plafon 32).
 */
export function sanitizePlateInput(raw: string, strict = true): string {
  const max = strict ? RO_PLATE_INPUT_MAX_LENGTH : PLATE_INPUT_MAX_LENGTH;
  // Flota păstrează cratima: „DE-ABC-123" e forma reală a unei plăcuțe
  // germane, iar normalizePlate o lasă intenționat neatinsă.
  const allowed = strict ? /[^A-Z0-9 ]/g : /[^A-Z0-9 -]/g;
  return raw
    .toUpperCase()
    .replace(allowed, "")
    .replace(/ {2,}/g, " ")
    .trimStart()
    .slice(0, max);
}

/** Formatul e de plăcuță RO? Pe inputul brut, cu spații opționale. */
export function isValidRoPlateInput(raw: string): boolean {
  return RO_PLATE_INPUT_REGEX.test(raw.trim());
}

/**
 * Aduce o plăcuță la forma canonică unică: „B 12 ABC", „CJ 34 DEF".
 *
 * Fără asta, aceeași mașină ajunge în DB scrisă în mai multe feluri
 * („B12ABC", „b 12 abc", „B-12-ABC"), iar căutarea după plăcuță nu le mai
 * leagă între ele. Normalizarea se face la intrare, nu la citire, ca baza de
 * date să aibă o singură reprezentare per mașină.
 *
 * Dacă inputul NU are formă de plăcuță RO, se întoarce neatins (doar trimmed,
 * uppercase, spații colapsate). Asta contează pentru flotele B2B, care pot
 * avea camioane înmatriculate în afara României: o plăcuță „DE-ABC-123" nu
 * trebuie compactată la „DEABC123", ci păstrată așa cum a scris-o omul.
 * Acolo unde e nevoie de formă RO strictă, verificarea o face schema.
 */
export function normalizePlate(raw: string): string {
  const bounded = raw.slice(0, PLATE_INPUT_MAX_LENGTH).toUpperCase();
  // Eliminăm tot ce nu e literă sau cifră — spații, cratime, puncte — doar ca
  // să testăm potrivirea; forma compactă nu se întoarce niciodată ca atare.
  const compact = bounded.replace(/[^A-Z0-9]/g, "");
  const parts = RO_PLATE_PARTS.exec(compact);
  if (parts) return `${parts[1]} ${parts[2]} ${parts[3]}`;
  return bounded.trim().replace(/\s+/g, " ");
}
