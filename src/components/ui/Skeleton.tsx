/** Bloc gri, pulsant — piesa de bază pentru ecranele de încărcare. Un singur
 * loc pentru culoare și animație, ca toate skeletonurile din aplicație să
 * arate la fel. */
export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-slate-200 ${className}`} />;
}
