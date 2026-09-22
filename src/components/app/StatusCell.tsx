import { AlertTriangle } from "lucide-react";
import { daysUntil, formatDate, formatDayMonth, getStatus } from "@/lib/status";

const PILL =
  "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap";

/**
 * Eticheta de stare a unui document — SINGURA din aplicație. Card, tabel de
 * flotă, card de flotă pe mobil, modalul de detalii și lista de alerte
 * suplimentare o folosesc toate, ca același act să arate identic oriunde.
 * Înainte cardul și modalul aveau fiecare propria etichetă și se contraziceau
 * vizual pentru aceeași dată.
 *
 * Semafor (vezi CLAUDE.md):
 *   roșu      → „Expirat" / „Expiră azi", cu iconiță de alertă
 *   portocaliu → 1–15 zile, cu ziua și luna
 *   verde     → zilele rămase
 * Data completă e mereu în `title`, deci se vede la hover.
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
      <span className={`${PILL} bg-red-50 text-red-700 border border-red-200`} title={full}>
        <AlertTriangle size={12} aria-hidden />
        {d === 0 ? "Expiră azi" : "Expirat"}
      </span>
    );
  }

  if (status === "warning") {
    return (
      <span className={`${PILL} bg-amber-50 text-amber-800 border border-amber-200`} title={full}>
        {d} {d === 1 ? "zi" : "zile"} · {formatDayMonth(date)}
      </span>
    );
  }

  return (
    <span className={`${PILL} bg-emerald-50 text-emerald-700`} title={full}>
      {d} zile
    </span>
  );
}
