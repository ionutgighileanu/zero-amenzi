import { AlertTriangle } from "lucide-react";
import { daysUntil, formatDate, getStatus } from "@/lib/status";

const PILL =
  "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap";

/**
 * Eticheta de stare a unui document — SINGURA din aplicație (card, card de
 * flotă, tabel de flotă, modal, alerte suplimentare), ca același act să arate
 * identic oriunde.
 *
 * Data completă de expirare apare MEREU, pe fiecare etichetă. E informația de
 * bază a produsului: omul trebuie să vadă până când îi e valabil actul, nu
 * doar câte zile au mai rămas.
 *
 * Semafor (vezi CLAUDE.md):
 *   roșu       → „⚠ Expirat · 21 sept. 2026" / „⚠ Expiră azi · 22 sept. 2026"
 *   portocaliu → „9 zile · 1 oct. 2026" (1–15 zile)
 *   verde      → „150 zile · 19 feb. 2027"
 */
export function StatusCell({ date, pending }: { date: string | null | undefined; pending?: boolean }) {
  const status = getStatus(date);
  const d = daysUntil(date);

  if (status === "none") {
    // Verificarea încă nu s-a făcut: nici verde, nici liniuță. O liniuță ar
    // citi ca „nu are document", iar verdele ca „e în regulă".
    return pending ? (
      <span className={`${PILL} bg-slate-100 text-slate-600`}>
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse" aria-hidden />
        În verificare
      </span>
    ) : (
      <span className="text-sm text-slate-400">—</span>
    );
  }

  const full = formatDate(date);

  if (status === "expired") {
    return (
      <span className={`${PILL} bg-red-50 text-red-700 border border-red-200`}>
        <AlertTriangle size={12} aria-hidden />
        {d === 0 ? "Expiră azi" : "Expirat"}
        <span className="font-normal text-red-600/80">· {full}</span>
      </span>
    );
  }

  if (status === "warning") {
    return (
      <span className={`${PILL} bg-amber-50 text-amber-800 border border-amber-200`}>
        {d} {d === 1 ? "zi" : "zile"}
        <span className="font-normal text-amber-700/80">· {full}</span>
      </span>
    );
  }

  return (
    <span className={`${PILL} bg-emerald-50 text-emerald-700`}>
      {d} zile
      <span className="font-normal text-emerald-700/70">· {full}</span>
    </span>
  );
}
