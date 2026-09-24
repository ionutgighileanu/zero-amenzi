import { Skeleton } from "@/components/ui/Skeleton";

/** Vezi comentariul din src/app/app/garage/loading.tsx — același motiv,
 * dimensiuni oglindind FleetBoard (header + tabel) în loc de grila de carduri. */
export default function FleetLoading() {
  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-7">
      <div className="flex flex-wrap justify-between items-end gap-3 mb-6">
        <div>
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
        <Skeleton className="h-9 w-36 rounded-xl" />
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <Skeleton className="h-4 w-full max-w-xs" />
        </div>
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="p-4 flex items-center gap-4 border-b border-slate-100 last:border-0">
            <Skeleton className="h-7 w-24 rounded-lg shrink-0" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-16 shrink-0" />
            <Skeleton className="h-4 w-16 shrink-0" />
          </div>
        ))}
      </div>
    </main>
  );
}
