import { VerificationForm } from "@/components/VerificationForm";

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <section className="pt-16 sm:pt-24 pb-12 sm:pb-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="max-w-2xl">
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-[1.1]">
              Nu mai lua amenzi
              <br />
              <span className="text-[#003399]">pentru acte expirate.</span>
            </h1>
            <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed max-w-lg">
              Verifică instant ITP-ul, RCA-ul și rovinieta. Primești alerte înainte de
              expirare.
            </p>
            <div className="mt-8">
              <VerificationForm />
            </div>
            <p className="text-xs text-slate-400 mt-2.5">
              Gratuit, fără cont. Introdu doar numărul de înmatriculare.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
