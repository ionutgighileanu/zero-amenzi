import { Skeleton } from "@/components/ui/Skeleton";

/** Vezi comentariul din src/app/app/garage/loading.tsx. */
export default function SettingsLoading() {
  return (
    <main className="max-w-xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <div>
        <Skeleton className="h-6 w-36" />
        <Skeleton className="h-4 w-64 mt-2" />
      </div>
      {[0, 1, 2, 3].map((i) => (
        <div key={i}>
          <Skeleton className="h-3 w-20 mb-2" />
          <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      ))}
    </main>
  );
}
