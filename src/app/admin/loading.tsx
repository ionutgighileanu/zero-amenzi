import { Skeleton } from "@/components/ui/Skeleton";

/**
 * Vezi comentariul din src/app/app/garage/loading.tsx.
 *
 * Stă în src/app/admin/, nu într-un subdirector: layout.tsx (cu AdminTabs)
 * nu e blocat de fișierul ăsta — doar segmentul de sub el, adică exact
 * pagina care încă interoghează Supabase. Tab-urile rămân vizibile.
 */
export default function AdminLoading() {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
      <div className="p-4 border-b border-slate-100">
        <Skeleton className="h-4 w-full max-w-sm" />
      </div>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="p-4 flex items-center gap-4 border-b border-slate-100 last:border-0">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-20 shrink-0" />
        </div>
      ))}
    </div>
  );
}
