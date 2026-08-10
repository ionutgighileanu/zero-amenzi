import type { Metadata } from "next";
import { Shield } from "lucide-react";
import { Nav } from "@/components/landing/Nav";
import { VerificationForm } from "@/components/VerificationForm";

export const metadata: Metadata = {
  title: "Verifică ITP, RCA și rovinieta — AutoDocs",
  description: "Introdu numărul de înmatriculare. Îți spunem ce acte au expirat.",
};

export default function VerificarePage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Nav />
      <section className="pt-16 sm:pt-24 pb-24">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <span className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-brand mb-5">
            <Shield className="text-white" size={22} />
          </span>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight font-display">
            Verifică actele unei mașini
          </h1>
          <p className="mt-3 text-base text-slate-600 leading-relaxed">
            Introdu numărul de înmatriculare. Îți spunem ce acte au expirat.
          </p>
          <div className="mt-8 flex justify-center">
            <VerificationForm />
          </div>
          <p className="text-xs text-slate-400 mt-4">
            Gratuit, fără cont. Verificarea se face manual din surse oficiale —
            de obicei durează sub 24h.
          </p>
        </div>
      </section>
    </div>
  );
}
