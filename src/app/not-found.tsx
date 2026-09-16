import type { Metadata } from "next";
import Link from "next/link";
import { Shield, SearchX } from "lucide-react";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Pagina nu a fost găsită",
  // Paginile de eroare n-au ce căuta în rezultatele căutării.
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main className="min-h-screen bg-slate-50 flex-1 flex flex-col justify-center py-12 px-4">
      <div className="mx-auto w-full max-w-md text-center">
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2.5 mb-8 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 rounded-lg"
        >
          <span className="w-9 h-9 rounded-xl bg-brand flex items-center justify-center">
            <Shield className="text-white" size={19} aria-hidden="true" />
          </span>
          <span className="text-xl font-extrabold tracking-tight text-slate-900 font-display">
            Zero Amenzi
          </span>
        </Link>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-slate-100 mb-5">
            <SearchX className="h-6 w-6 text-slate-500" aria-hidden="true" />
          </div>

          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
            Eroare 404
          </p>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 font-display">
            Pagina nu a fost găsită
          </h1>
          <p className="text-sm text-slate-600 mt-2.5 leading-relaxed">
            Verifică adresa sau întoarce-te la pagina principală.
          </p>

          <div className="flex flex-col-reverse sm:flex-row gap-3 mt-7">
            <Button variant="outline" size="sm" href="/verificare" className="flex-1">
              Verifică actele
            </Button>
            <Button variant="primary" size="sm" href="/" className="flex-1">
              Pagina principală
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
