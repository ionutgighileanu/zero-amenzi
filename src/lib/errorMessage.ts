/**
 * Mesajul unei erori venite dintr-o Server Action, pentru afișare în interfață.
 *
 * Acțiunile aruncă `new Error("text pentru utilizator")` — inclusiv mesajele
 * traduse din constrângerile DB (vezi subscriptionErrorMessage din
 * actions/vehicles.ts). Next.js păstrează mesajul în dev; în producție îl
 * înlocuiește cu un text generic pentru erorile netratate, ca să nu scurgă
 * detalii de server. De-aia cade pe un mesaj neutru când nu are ce afișa.
 *
 * Există fiindcă înainte fiecare `catch` făcea doar `console.error(err)`, iar
 * utilizatorul nu vedea nimic: apăsa „Adaugă vehicul", nu se întâmpla nimic
 * vizibil, și nu avea cum să afle de ce.
 */
export function errorMessage(err: unknown): string {
  if (err instanceof Error && err.message.trim().length > 0) {
    return err.message;
  }
  return "Ceva n-a mers. Încearcă din nou sau reîncarcă pagina.";
}
