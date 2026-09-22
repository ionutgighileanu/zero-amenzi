/**
 * Normalizarea textului pentru căutare, aceeași la construirea indexului și
 * la interogare — altfel „Ștefan" n-ar fi găsit scris „stefan", iar
 * „B 100 ABC" n-ar fi găsit scris „b100abc".
 *
 * Fișier separat de src/lib/admin/users.ts: acela creează clientul cu
 * service_role și n-are voie să ajungă în bundle-ul de client. Aici e doar
 * text, deci îl pot folosi și tabelul (componentă de client), și serverul.
 */

/** Litere mici, fără diacritice. Păstrează spațiile și punctuația. */
export function normalizeSearch(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

/** Doar litere și cifre — pentru plăcuțe, VIN și CUI, unde spațiile,
 * cratimele și prefixul „RO" se scriu diferit de fiecare dată. */
export function compactSearch(value: string): string {
  return normalizeSearch(value).replace(/[^a-z0-9]/g, "");
}
