import { daysUntil, formatDate, getStatus } from "@/lib/status";

/**
 * Semafor calibrat (vezi CLAUDE.md):
 * valid   → tăcut: punct verde + dată gri
 * warning → pastilă amber cu nr. de zile
 * expired → pastilă roșie solidă
 */
export function StatusCell({ date }: { date: string | null | undefined }) {
  const status = getStatus(date);
  const d = daysUntil(date);

  if (status === "none") return <span className="text-slate-500 text-sm">—</span>;

  if (status === "valid")
    return (
      <span className="inline-flex items-center gap-1.5 text-sm text-slate-500">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" aria-hidden />
        {formatDate(date)}
      </span>
    );

  if (status === "warning")
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-1">
        {d === 0 ? "Expiră azi" : `${d} ${d === 1 ? "zi" : "zile"}`}
        <span className="font-normal text-amber-600">· {formatDate(date)}</span>
      </span>
    );

  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-red-600 rounded-full px-2.5 py-1">
      Expirat
      <span className="font-normal text-red-100">· {formatDate(date)}</span>
    </span>
  );
}
