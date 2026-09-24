import { Skeleton } from "@/components/ui/Skeleton";

/**
 * Se arată cât timp `page.tsx` așteaptă interogările Supabase.
 *
 * Fără fișierul ăsta, browserul rămânea pe ecranul vechi până se rezolvau
 * toate interogările, ceea ce pare un blocaj mai degrabă decât o încărcare —
 * mai ales pe conexiuni lente sau când Supabase e departe geografic.
 *
 * Dimensiunile blocurilor oglindesc structura reală din GarageBoard, ca
 * apariția conținutului adevărat să nu sară layoutul.
 */
export default function GarageLoading() {
  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-7">
      <div className="flex flex-wrap justify-between items-end gap-3 mb-6">
        <div>
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-56 mt-2" />
        </div>
        <Skeleton className="h-9 w-36 rounded-xl" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
            <Skeleton className="h-9 w-32 rounded-lg" />
            <div className="space-y-2.5 pt-2">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-full" />
            </div>
            <Skeleton className="h-9 w-full rounded-xl" />
          </div>
        ))}
      </div>
    </main>
  );
}
