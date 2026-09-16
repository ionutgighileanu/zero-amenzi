import type { ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Nav } from "@/components/landing/Nav";

/**
 * Carcasa comună pentru paginile legale (/politica-confidentialitate,
 * /termeni). Ține tipografia și avertismentul juridic într-un singur loc,
 * ca cele două pagini să nu divergă.
 */
export function LegalPage({
  title,
  updatedAt,
  children,
}: {
  title: string;
  updatedAt: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Nav />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight font-display">{title}</h1>
        <p className="text-sm text-slate-500 mt-3">Ultima actualizare: {updatedAt}</p>

        <div
          className="mt-6 flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900"
          role="note"
        >
          <AlertTriangle size={16} className="shrink-0 mt-0.5" aria-hidden="true" />
          <p>
            <strong>Acest document este informativ.</strong> Consultă un avocat înainte de
            lansarea publică.
          </p>
        </div>

        <div className="mt-10 space-y-8 text-[15px] leading-relaxed text-slate-700">{children}</div>
      </main>
    </div>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-extrabold tracking-tight text-slate-900 font-display">{title}</h2>
      {children}
    </section>
  );
}

export function LegalList({ items }: { items: ReactNode[] }) {
  return (
    <ul className="space-y-2 pl-5 list-disc marker:text-slate-400">
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
}
