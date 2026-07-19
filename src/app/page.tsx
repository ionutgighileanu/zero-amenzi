import {
  Shield,
  ChevronRight,
  Search,
  Bell,
  Zap,
  Mail,
  MessageSquare,
  Car,
  Truck,
  Users,
  AlertTriangle,
  ArrowRight,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Plate } from "@/components/ui/Plate";
import { VerificationForm } from "@/components/VerificationForm";
import { Nav } from "@/components/landing/Nav";
import { Faq } from "@/components/landing/Faq";
import { BRAND_BLUE } from "@/lib/constants";

function Section({
  children,
  className = "",
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={`py-16 sm:py-24 ${className}`}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6">{children}</div>
    </section>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: BRAND_BLUE }}>
      {children}
    </p>
  );
}

function SectionTitle({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h2 className={`text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 font-display ${className}`}>
      {children}
    </h2>
  );
}

const B2B_MOCK_ROWS: [string, [string, string], [string, string], [string, string]][] = [
  ["B 10 FLT", ["3 zile", "text-red-600 bg-red-50"], ["ok", "text-emerald-700"], ["ok", "text-emerald-700"]],
  ["B 11 FLT", ["ok", "text-emerald-700"], ["ok", "text-emerald-700"], ["12 zile", "text-amber-700 bg-amber-50"]],
  ["IF 05 CAR", ["expirat", "text-red-600 bg-red-50"], ["45 zile", "text-slate-500"], ["ok", "text-emerald-700"]],
];

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Nav />

      {/* HERO */}
      <section className="pt-16 sm:pt-24 pb-12 sm:pb-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="max-w-2xl">
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-[1.1] font-display">
              Nu mai lua amenzi
              <br />
              <span style={{ color: BRAND_BLUE }}>pentru acte expirate.</span>
            </h1>
            <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed max-w-lg">
              Verifică instant ITP-ul, RCA-ul și rovinieta. Primești alerte înainte de
              expirare. Pentru mașina personală sau pentru toată flota.
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

      {/* TRUST BAR */}
      <div className="border-y border-slate-100 bg-slate-50/60">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-2 sm:grid-cols-4 gap-6">
          {[
            ["100%", "Gratuit la start"],
            ["30 sec", "Verificare completă"],
            ["3 alerte", "Înainte de expirare"],
            ["0 lei", "Amenzi evitate"],
          ].map(([big, small]) => (
            <div key={small} className="text-center">
              <p className="text-xl sm:text-2xl font-extrabold text-slate-900 font-display">
                {big}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">{small}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CUM FUNCȚIONEAZĂ */}
      <Section id="cum-functioneaza">
        <SectionLabel>Cum funcționează</SectionLabel>
        <SectionTitle>Trei pași. Apoi nu mai faci nimic.</SectionTitle>
        <div className="mt-10 grid sm:grid-cols-3 gap-8">
          {(
            [
              [Car, "Introdu numărul mașinii", "Scrii numărul de înmatriculare și seria de șasiu din talon. Atât — două câmpuri, fără formulare lungi."],
              [Search, "Verificăm totul automat", "Interogăm bazele oficiale pentru ITP, RCA și rovinietă. Tu nu completezi nicio dată de expirare manual."],
              [Bell, "Primești alerte la timp", "Email cu 30, 15 și 2 zile înainte de expirare, plus în ziua expirării. Cu PRO, primești și SMS."],
            ] as const
          ).map(([Icon, title, desc], i) => (
            <div key={i} className="flex flex-col">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                style={{ backgroundColor: `${BRAND_BLUE}0D` }}
              >
                <Icon size={20} style={{ color: BRAND_BLUE }} />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1.5 font-display">{title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* AMENZI — urgency section */}
      <section className="bg-slate-900 text-white py-16 sm:py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <SectionLabel>
            <span className="text-blue-400">De ce contează</span>
          </SectionLabel>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight max-w-lg mb-10 font-display">
            O singură notificare te scutește de mii de lei.
          </h2>
          <div className="space-y-4">
            {[
              ["ITP expirat", "1.822 – 8.100 lei", "Amendă + reținerea certificatului și a plăcuțelor de înmatriculare."],
              ["RCA expirat", "1.000 – 2.000 lei", "Amendă + răspundere civilă personală nelimitată în caz de accident."],
              ["Rovinietă lipsă", "500 – 1.000 lei", "Amendă automată prin camerele CNAIR. Vine acasă fără oprire în trafic."],
            ].map(([title, amount, desc]) => (
              <div key={title} className="rounded-2xl border border-slate-700/60 bg-slate-800/40 p-6">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle size={15} className="text-slate-400 shrink-0" />
                  <span className="text-sm font-semibold text-slate-300">{title}</span>
                </div>
                <p className="text-2xl sm:text-3xl font-black text-white leading-none mb-2 font-display">
                  {amount}
                </p>
                <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* VERIFICĂRI PUBLICE */}
      <Section id="verificari">
        <SectionLabel>Verificări instant</SectionLabel>
        <SectionTitle>Un număr de înmatriculare, toate actele verificate.</SectionTitle>
        <p className="text-sm text-slate-600 mt-2 max-w-lg">
          Gratuit, fără cont. Rezultatul apare în câteva secunde.
        </p>
        <div className="mt-8 grid sm:grid-cols-2 gap-4">
          {[
            ["Verificare ITP", "Inspecția tehnică periodică — valabilă sau expirată?"],
            ["Verificare RCA", "Asigurarea obligatorie — e activă polița?"],
            ["Verificare Rovinietă", "Taxa de drum — activă sau expirată?"],
            ["Calculator RCA", "Compară prețuri de la mai mulți asigurători."],
          ].map(([title, desc]) => (
            <a
              key={title}
              href="#"
              className="group flex items-center justify-between gap-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl p-4 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
            >
              <div>
                <h3 className="text-sm font-bold text-slate-900">{title}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
              </div>
              <ArrowRight
                size={16}
                className="text-slate-400 group-hover:text-slate-700 shrink-0 transition-colors"
              />
            </a>
          ))}
        </div>
      </Section>

      {/* B2B TEASER */}
      <section className="border-y border-slate-200 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-24 grid sm:grid-cols-2 gap-10 items-center">
          <div>
            <SectionLabel>Pentru firme</SectionLabel>
            <SectionTitle>Tabelul care înlocuiește Excel-ul.</SectionTitle>
            <p className="text-sm text-slate-600 mt-3 leading-relaxed">
              Un dashboard centralizat cu toate mașinile firmei, alertele setate, un tab
              de șoferi cu atestate și avize, și factură pe CUI. Managerul vede într-o
              privire ce expiră — fără să deschidă vreun Excel.
            </p>
            <div className="mt-6 flex gap-3">
              <Button variant="primary" href="/signup?tip=firma">
                Conectează firma
              </Button>
              <Button variant="ghost" href="#cum-functioneaza">
                Cum funcționează <ChevronRight size={16} />
              </Button>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 overflow-hidden">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-3">
              <Truck size={15} className="text-slate-400" />
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Flotă — 3 vehicule
              </span>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="text-[10px] text-slate-400 uppercase tracking-wider">
                  <th className="text-left py-1.5">Vehicul</th>
                  <th className="text-left py-1.5">RCA</th>
                  <th className="text-left py-1.5">ITP</th>
                  <th className="text-left py-1.5">Rov.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {B2B_MOCK_ROWS.map(([plate, rca, itp, rov]) => (
                  <tr key={plate}>
                    <td className="py-2">
                      <Plate plate={plate} size="sm" />
                    </td>
                    <td className="py-2">
                      <span className={`inline-block rounded-full px-2 py-0.5 font-semibold ${rca[1]}`}>
                        {rca[0]}
                      </span>
                    </td>
                    <td className="py-2">
                      <span className={`inline-block rounded-full px-2 py-0.5 font-semibold ${itp[1]}`}>
                        {itp[0]}
                      </span>
                    </td>
                    <td className="py-2">
                      <span className={`inline-block rounded-full px-2 py-0.5 font-semibold ${rov[1]}`}>
                        {rov[0]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <Section id="tarife">
        <div className="text-center">
          <SectionLabel>Tarife</SectionLabel>
          <SectionTitle className="mx-auto">Începi gratuit. Fără card.</SectionTitle>
          <p className="text-sm text-slate-500 mt-2">
            Upgrade la PRO oricând — sau gratuit la fiecare RCA cumpărat prin noi.
          </p>
        </div>

        <div className="mt-12 grid sm:grid-cols-3 gap-5 items-start">
          {/* Gratuit */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col">
            <div>
              <span className="text-4xl sm:text-5xl font-black text-slate-900 font-display">0</span>
              <span className="text-base font-semibold text-slate-400 ml-1.5">lei</span>
            </div>
            <p className="text-base font-bold text-slate-900 mt-2">Gratuit</p>
            <p className="text-sm text-slate-500 mt-1">
              1 vehicul, verificare unică, alerte email.
            </p>
            <div className="border-t border-slate-200 my-5" />
            <ul className="space-y-3 text-sm text-slate-600 flex-1">
              {(
                [
                  [Check, "Verificare ITP, RCA, rovinietă"],
                  [Mail, "Notificări pe email"],
                  [Car, "1 vehicul monitorizat"],
                  [Search, "Actualizare la cerere"],
                ] as const
              ).map(([Icon, label]) => (
                <li key={label} className="flex items-center gap-2.5">
                  <Icon size={15} className="text-slate-400 shrink-0" />
                  {label}
                </li>
              ))}
            </ul>
            <Button variant="outline" className="w-full mt-6" href="/signup">
              Creează cont gratuit
            </Button>
          </div>

          {/* PRO */}
          <div
            className="rounded-2xl border-2 p-6 flex flex-col relative sm:-mt-4 shadow-xl"
            style={{ borderColor: BRAND_BLUE }}
          >
            <span
              className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-widest text-white rounded-full px-3 py-1 whitespace-nowrap"
              style={{ backgroundColor: BRAND_BLUE }}
            >
              Recomandat
            </span>
            <div>
              <span className="text-4xl sm:text-5xl font-black text-slate-900 font-display">15</span>
              <span className="text-base font-semibold text-slate-400 ml-1.5">
                lei / an · vehicul
              </span>
            </div>
            <p className="text-base font-bold text-slate-900 mt-2">PRO</p>
            <p className="text-sm mt-1" style={{ color: BRAND_BLUE }}>
              Gratuit cu RCA cumpărat prin noi.
            </p>
            <div className="border-t border-slate-200 my-5" />
            <ul className="space-y-3 text-sm text-slate-600 flex-1">
              {(
                [
                  [Check, "Vehicule nelimitate"],
                  [MessageSquare, "Alerte email + SMS"],
                  [Zap, "Actualizare automată recurentă"],
                  [Car, "ITP, RCA, rovinietă + ARR"],
                  [Bell, "Alerte suplimentare (CASCO, service…)"],
                  [Check, "Dashboard flotă B2B"],
                ] as const
              ).map(([Icon, label]) => (
                <li key={label} className="flex items-center gap-2.5">
                  <Icon size={15} className="shrink-0" style={{ color: BRAND_BLUE }} />
                  {label}
                </li>
              ))}
            </ul>
            <Button variant="primary" className="w-full mt-6" href="/signup">
              Activează PRO
            </Button>
          </div>

          {/* Flotă */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col">
            <div>
              <span className="text-3xl sm:text-4xl font-black text-slate-900 font-display">
                Flotă
              </span>
            </div>
            <p className="text-base font-bold text-slate-900 mt-2">B2B</p>
            <p className="text-sm text-slate-500 mt-1">
              Factură pe CUI. Management centralizat.
            </p>
            <div className="border-t border-slate-200 my-5" />
            <ul className="space-y-3 text-sm text-slate-600 flex-1">
              {(
                [
                  [Check, "Tot ce include PRO"],
                  [Truck, "Vehicule nelimitate per firmă"],
                  [Users, "Șoferi cu atestate și avize"],
                  [Bell, "Alerte ARR și tahograf"],
                  [Check, "Factură pe CUI"],
                  [Check, "Adăugare vehicule în bulk"],
                ] as const
              ).map(([Icon, label]) => (
                <li key={label} className="flex items-center gap-2.5">
                  <Icon size={15} className="text-slate-400 shrink-0" />
                  {label}
                </li>
              ))}
            </ul>
            <Button variant="outline" className="w-full mt-6" href="/signup?tip=firma">
              Conectează firma
            </Button>
          </div>
        </div>
      </Section>

      {/* FAQ */}
      <Section id="faq" className="bg-slate-50 border-y border-slate-200">
        <div className="max-w-2xl mx-auto">
          <SectionLabel>Întrebări frecvente</SectionLabel>
          <SectionTitle>Tot ce trebuie să știi.</SectionTitle>
          <Faq />
        </div>
      </Section>

      {/* FINAL CTA */}
      <section className="py-16 sm:py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-display">
            Nu mai uita de actele auto.
          </h2>
          <p className="text-sm text-slate-600 mt-2 max-w-md mx-auto">
            Creează un cont gratuit, adaugă mașina, și primești alerte înainte de
            expirare. 30 de secunde, zero bani.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button size="lg" href="/signup">
              Creează cont gratuit
            </Button>
            <Button variant="outline" size="lg" href="#tarife">
              Vezi tarifele
            </Button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
            <div className="col-span-2 sm:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <span
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: BRAND_BLUE }}
                >
                  <Shield className="text-white" size={14} />
                </span>
                <span className="font-extrabold text-sm font-display">AutoDocs</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Verificare automată a actelor auto și alerte înainte de expirare. Pentru
                șoferi și flote.
              </p>
            </div>

            {[
              ["Verificări", [["Verificare ITP", "#"], ["Verificare RCA", "#"], ["Verificare Rovinietă", "#"], ["Calculator RCA", "#"]]],
              ["Resurse", [["Amenzi auto 2026", "#"], ["Acte necesare", "#"], ["Stații ITP", "#"], ["Blog", "#"]]],
              ["Legal", [["Termeni și Condiții", "#"], ["Confidențialitate", "#"], ["Contact", "#"]]],
            ].map(([title, links]) => (
              <div key={title as string}>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  {title as string}
                </p>
                <ul className="space-y-2">
                  {(links as [string, string][]).map(([label, href]) => (
                    <li key={label}>
                      <a href={href} className="text-sm text-slate-600 hover:text-slate-900">
                        {label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-10 pt-6 border-t border-slate-200 flex flex-wrap justify-between items-center gap-3">
            <p className="text-xs text-slate-400">© 2026 AutoDocs. Toate drepturile rezervate.</p>
            <p className="text-xs text-slate-400">Un produs românesc.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
