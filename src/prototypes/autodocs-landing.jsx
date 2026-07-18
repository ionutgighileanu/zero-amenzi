import React, { useState } from 'react';
import {
  Shield, ChevronRight, ChevronDown, Check, Search,
  Bell, Zap, Mail, MessageSquare, Car, Truck, Users,
  AlertTriangle, ArrowRight, Menu, X
} from 'lucide-react';

/* ══════════════════════════════════════════════════════════
   AUTODOCS — Landing Page
   Semnătura: plăcuța RO ca identitate de brand și ca input.
   Job: utilizatorul introduce un număr de înmatriculare,
   verifică instant, apoi își face cont.
   ══════════════════════════════════════════════════════════ */

const BLUE = '#003399';

/* ---------- Plăcuța RO (identitate vizuală) ---------- */
const Plate = ({ plate, size = 'md' }) => {
  const s = {
    sm: { band: 'w-4 text-[7px]', text: 'text-[13px] px-2 py-0.5', star: 'text-[5px]' },
    md: { band: 'w-5 text-[8px]', text: 'text-[15px] px-2.5 py-1', star: 'text-[6px]' },
    lg: { band: 'w-7 text-[10px]', text: 'text-xl px-3.5 py-1.5', star: 'text-[8px]' },
  }[size];
  return (
    <span className="inline-flex items-stretch rounded-md overflow-hidden border border-slate-300 shadow-sm select-none shrink-0" style={{ fontFamily: "'Archivo', sans-serif" }}>
      <span className={`${s.band} flex flex-col items-center justify-center text-white font-bold leading-none gap-0.5`} style={{ backgroundColor: BLUE }}>
        <span className={s.star} aria-hidden>★</span><span>RO</span>
      </span>
      <span className={`${s.text} bg-white font-extrabold tracking-widest text-slate-900 leading-none flex items-center`}>
        {plate}
      </span>
    </span>
  );
};

/* ---------- UI primitives ---------- */
const Button = ({ children, variant = 'primary', size = 'md', className = '', href, onClick }) => {
  const base = 'inline-flex items-center justify-center font-semibold rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-700';
  const variants = {
    primary: 'text-white hover:opacity-90',
    outline: 'bg-white text-slate-700 border border-slate-300 hover:border-slate-400 hover:bg-slate-50',
    ghost:   'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
  };
  const sizes = { sm: 'px-4 py-2 text-sm', md: 'px-5 py-2.5 text-sm', lg: 'px-6 py-3 text-base' };
  const style = variant === 'primary' ? { backgroundColor: BLUE } : undefined;
  const Tag = href ? 'a' : 'button';
  return <Tag href={href} onClick={onClick} style={style} className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}>{children}</Tag>;
};

const Section = ({ children, className = '', id }) => (
  <section id={id} className={`py-16 sm:py-24 ${className}`}><div className="max-w-5xl mx-auto px-4 sm:px-6">{children}</div></section>
);

const SectionLabel = ({ children }) => (
  <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: BLUE }}>{children}</p>
);

const SectionTitle = ({ children, className = '' }) => (
  <h2 className={`text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 ${className}`} style={{ fontFamily: "'Archivo', sans-serif" }}>{children}</h2>
);

/* ---------- FAQ ---------- */
const faqData = [
  ['Ce este AutoDocs?', 'AutoDocs verifică automat dacă ITP-ul, RCA-ul și rovinieta mașinii tale sunt valabile și te notifică înainte de expirare, ca să nu mai iei amenzi. Funcționează și pentru persoane fizice, și pentru flote de companie.'],
  ['Cât costă?', 'Contul gratuit include 1 vehicul cu verificare unică și notificări pe email. Contul PRO (15 lei/an per vehicul) adaugă monitorizare recurentă, alerte SMS și documente suplimentare (extinctor, CASCO, service etc.). PRO e gratuit dacă îți faci RCA prin noi.'],
  ['Cum funcționează notificările?', 'Primești alerte cu 30 de zile, 15 zile, 2 zile și în ziua expirării — pe email (cont gratuit) sau email + SMS (cont PRO). Pe telefonul mobil, aplicația PWA trimite și notificări push gratuit.'],
  ['Ce riscuri am cu actele expirate?', 'ITP expirat: amendă 1.822–4.050 lei + reținerea plăcuțelor. RCA expirat: 1.000–2.000 lei + răspundere personală nelimitată. Rovinietă lipsă: 500–1.000 lei (amendă automată prin camerele CNAIR). O singură notificare te poate scuti de mii de lei.'],
  ['Pot monitoriza mai multe mașini?', 'Da. Cu planul PRO adaugi oricâte vehicule — ideal pentru familii sau firme. Fiecare vehicul are propriile alerte.'],
  ['Pot cumpăra RCA prin AutoDocs?', 'Da. Compari oferte de la mai mulți asigurători, alegi cea mai ieftină și închei polița online. Bonus: primești PRO gratuit 1 an la fiecare RCA cumpărat prin noi.'],
  ['Stocați documente personale?', 'Nu. Nu stocăm copii ale buletinului, permisului sau altor acte de identitate. Salvăm doar datele de expirare necesare pentru alerte — nimic mai mult.'],
  ['Funcționează și pe telefon?', 'Da. AutoDocs este un PWA (Progressive Web App) — îl instalezi direct din browser pe ecranul principal, fără App Store sau Google Play. Funcționează offline și primești notificări push ca o aplicație nativă.'],
];

const FaqItem = ({ q, a }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-slate-200">
      <button onClick={() => setOpen(!open)} className="w-full flex justify-between items-center gap-4 py-4 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 rounded">
        <span className="text-sm sm:text-base font-semibold text-slate-900">{q}</span>
        <ChevronDown size={18} className={`shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <p className="text-sm text-slate-600 pb-4 leading-relaxed">{a}</p>}
    </div>
  );
};

/* ---------- Mock verification result ---------- */
const VerifResult = ({ plate }) => (
  <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-5 sm:p-6 mt-5 space-y-3">
    <div className="flex items-center gap-3">
      <Plate plate={plate} size="md" />
      <span className="text-sm text-slate-500">Volkswagen Golf · 2019</span>
    </div>
    <div className="grid grid-cols-3 gap-3">
      {[
        ['ITP', 'Valabil', '247 zile', 'emerald'],
        ['Rovinietă', 'Expiră curând', '12 zile', 'amber'],
        ['RCA', 'Expirat', '-3 zile', 'red'],
      ].map(([label, status, days, tone]) => (
        <div key={label} className={`rounded-xl border p-3 ${tone === 'red' ? 'border-red-200 bg-red-50' : tone === 'amber' ? 'border-amber-200 bg-amber-50' : 'border-slate-200 bg-slate-50'}`}>
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">{label}</p>
          <p className={`text-sm font-bold ${tone === 'red' ? 'text-red-700' : tone === 'amber' ? 'text-amber-700' : 'text-emerald-700'}`}>{status}</p>
          <p className="text-xs text-slate-500 mt-0.5">{days}</p>
        </div>
      ))}
    </div>
    <div className="flex flex-col sm:flex-row gap-2 pt-1">
      <Button variant="primary" className="flex-1">Creează cont și activează alertele</Button>
      <Button variant="outline" className="flex-1">Reînnoiește RCA — compară prețuri</Button>
    </div>
  </div>
);

/* ══════════════════ LANDING PAGE ══════════════════ */
export default function Landing() {
  const [plate, setPlate] = useState('');
  const [verified, setVerified] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

  const handleVerify = (e) => {
    e.preventDefault();
    if (plate.trim().length >= 5) setVerified(true);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Archivo:wght@500;700;800;900&family=Inter:wght@400;500;600;700&display=swap');
        body { font-family: 'Inter', system-ui, sans-serif; }
        html { scroll-behavior: smooth; }
        @media (prefers-reduced-motion: reduce) { * { transition: none !important; animation: none !important; } html { scroll-behavior: auto; } }
      `}</style>

      {/* ═══ NAV ═══ */}
      <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex justify-between items-center h-14">
          <a href="#" className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: BLUE }}>
              <Shield className="text-white" size={17} />
            </span>
            <span className="text-lg font-extrabold tracking-tight" style={{ fontFamily: "'Archivo', sans-serif" }}>AutoDocs</span>
          </a>

          <div className="hidden sm:flex items-center gap-6 text-sm">
            <a href="#cum-functioneaza" className="text-slate-600 hover:text-slate-900">Cum funcționează</a>
            <a href="#verificari" className="text-slate-600 hover:text-slate-900">Verificări</a>
            <a href="#tarife" className="text-slate-600 hover:text-slate-900">Tarife</a>
            <a href="#faq" className="text-slate-600 hover:text-slate-900">Întrebări</a>
            <Button variant="outline" size="sm">Conectare</Button>
            <Button variant="primary" size="sm">Creează cont</Button>
          </div>

          <button className="sm:hidden p-2 text-slate-500 hover:text-slate-900 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-700" onClick={() => setMobileMenu(!mobileMenu)} aria-label="Meniu">
            {mobileMenu ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        {mobileMenu && (
          <div className="sm:hidden border-t border-slate-100 bg-white px-4 py-4 space-y-3">
            {[['#cum-functioneaza', 'Cum funcționează'], ['#verificari', 'Verificări'], ['#tarife', 'Tarife'], ['#faq', 'Întrebări']].map(([href, label]) => (
              <a key={href} href={href} onClick={() => setMobileMenu(false)} className="block text-sm font-medium text-slate-700">{label}</a>
            ))}
            <div className="flex gap-2 pt-2">
              <Button variant="outline" size="sm" className="flex-1">Conectare</Button>
              <Button variant="primary" size="sm" className="flex-1">Creează cont</Button>
            </div>
          </div>
        )}
      </nav>

      {/* ═══ HERO ═══ */}
      <section className="pt-16 sm:pt-24 pb-12 sm:pb-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="max-w-2xl">
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-[1.1]" style={{ fontFamily: "'Archivo', sans-serif" }}>
              Nu mai lua amenzi<br />
              <span style={{ color: BLUE }}>pentru acte expirate.</span>
            </h1>
            <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed max-w-lg">
              Verifică instant ITP-ul, RCA-ul și rovinieta. Primești alerte înainte de expirare. Pentru mașina personală sau pentru toată flota.
            </p>

            {/* Input-ul de verificare — hero-ul ÎN SINE e produsul */}
            <form onSubmit={handleVerify} className="mt-8 flex gap-2 max-w-md">
              <div className="flex-1 relative">
                <div className="absolute left-0 top-0 bottom-0 w-8 rounded-l-xl flex items-center justify-center text-white text-[9px] font-bold" style={{ backgroundColor: BLUE }}>
                  <div className="flex flex-col items-center leading-none gap-0.5">
                    <span className="text-[6px]">★</span>
                    <span>RO</span>
                  </div>
                </div>
                <input
                  value={plate} onChange={(e) => { setPlate(e.target.value.toUpperCase()); setVerified(false); }}
                  placeholder="B 100 ABC"
                  className="w-full border border-slate-300 rounded-xl pl-11 pr-3 py-3 text-base font-bold tracking-wider text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-700 focus:border-blue-700"
                  style={{ fontFamily: "'Archivo', sans-serif" }}
                  required
                />
              </div>
              <Button type="submit" variant="primary" size="lg">
                <Search size={18} className="mr-2" /> Verifică
              </Button>
            </form>
            <p className="text-xs text-slate-400 mt-2.5">Gratuit, fără cont. Introdu doar numărul de înmatriculare.</p>
          </div>

          {verified && <VerifResult plate={plate} />}
        </div>
      </section>

      {/* ═══ TRUST BAR ═══ */}
      <div className="border-y border-slate-100 bg-slate-50/60">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-2 sm:grid-cols-4 gap-6">
          {[
            ['100%', 'Gratuit la start'],
            ['30 sec', 'Verificare completă'],
            ['3 alerte', 'Înainte de expirare'],
            ['0 lei', 'Amenzi evitate'],
          ].map(([big, small]) => (
            <div key={small} className="text-center">
              <p className="text-xl sm:text-2xl font-extrabold text-slate-900" style={{ fontFamily: "'Archivo', sans-serif" }}>{big}</p>
              <p className="text-xs text-slate-500 mt-0.5">{small}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ CUM FUNCȚIONEAZĂ ═══ */}
      <Section id="cum-functioneaza">
        <SectionLabel>Cum funcționează</SectionLabel>
        <SectionTitle>Trei pași. Apoi nu mai faci nimic.</SectionTitle>
        <div className="mt-10 grid sm:grid-cols-3 gap-8">
          {[
            [Car, 'Introdu numărul mașinii', 'Scrii numărul de înmatriculare și seria de șasiu din talon. Atât — două câmpuri, fără formulare lungi.'],
            [Search, 'Verificăm totul automat', 'Interogăm bazele oficiale pentru ITP, RCA și rovinietă. Tu nu completezi nicio dată de expirare manual.'],
            [Bell, 'Primești alerte la timp', 'Email cu 30, 15 și 2 zile înainte de expirare, plus în ziua expirării. Cu PRO, primești și SMS.'],
          ].map(([Icon, title, desc], i) => (
            <div key={i} className="flex flex-col">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: `${BLUE}0D` }}>
                <Icon size={20} style={{ color: BLUE }} />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1.5" style={{ fontFamily: "'Archivo', sans-serif" }}>{title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ═══ AMENZI — urgency section ═══ */}
      <section className="bg-slate-900 text-white py-16 sm:py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <SectionLabel><span className="text-blue-400">De ce contează</span></SectionLabel>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight max-w-lg mb-10" style={{ fontFamily: "'Archivo', sans-serif" }}>
            O singură notificare te scutește de mii de lei.
          </h2>
          <div className="space-y-4">
            {[
              ['ITP expirat', '1.822 – 8.100 lei', 'Amendă + reținerea certificatului și a plăcuțelor de înmatriculare.'],
              ['RCA expirat', '1.000 – 2.000 lei', 'Amendă + răspundere civilă personală nelimitată în caz de accident.'],
              ['Rovinietă lipsă', '500 – 1.000 lei', 'Amendă automată prin camerele CNAIR. Vine acasă fără oprire în trafic.'],
            ].map(([title, amount, desc]) => (
              <div key={title} className="rounded-2xl border border-slate-700/60 bg-slate-800/40 p-6">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle size={15} className="text-slate-400 shrink-0" />
                  <span className="text-sm font-semibold text-slate-300">{title}</span>
                </div>
                <p className="text-2xl sm:text-3xl font-black text-white leading-none mb-2" style={{ fontFamily: "'Archivo', sans-serif" }}>{amount}</p>
                <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ VERIFICĂRI PUBLICE ═══ */}
      <Section id="verificari">
        <SectionLabel>Verificări instant</SectionLabel>
        <SectionTitle>Un număr de înmatriculare, toate actele verificate.</SectionTitle>
        <p className="text-sm text-slate-600 mt-2 max-w-lg">Gratuit, fără cont. Rezultatul apare în câteva secunde.</p>
        <div className="mt-8 grid sm:grid-cols-2 gap-4">
          {[
            ['Verificare ITP', 'Inspecția tehnică periodică — valabilă sau expirată?'],
            ['Verificare RCA', 'Asigurarea obligatorie — e activă polița?'],
            ['Verificare Rovinietă', 'Taxa de drum — activă sau expirată?'],
            ['Calculator RCA', 'Compară prețuri de la mai mulți asigurători.'],
          ].map(([title, desc]) => (
            <a key={title} href="#" className="group flex items-center justify-between gap-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl p-4 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-700">
              <div>
                <h3 className="text-sm font-bold text-slate-900">{title}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
              </div>
              <ArrowRight size={16} className="text-slate-400 group-hover:text-slate-700 shrink-0 transition-colors" />
            </a>
          ))}
        </div>
      </Section>

      {/* ═══ B2B TEASER ═══ */}
      <section className="border-y border-slate-200 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-24 grid sm:grid-cols-2 gap-10 items-center">
          <div>
            <SectionLabel>Pentru firme</SectionLabel>
            <SectionTitle>Tabelul care înlocuiește Excel-ul.</SectionTitle>
            <p className="text-sm text-slate-600 mt-3 leading-relaxed">
              Un dashboard centralizat cu toate mașinile firmei, alertele setate, un tab de șoferi cu atestate și avize, și factură pe CUI. Managerul vede într-o privire ce expiră — fără să deschidă vreun Excel.
            </p>
            <div className="mt-6 flex gap-3">
              <Button variant="primary">Conectează firma</Button>
              <Button variant="ghost">Cum funcționează <ChevronRight size={16} /></Button>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 overflow-hidden">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-3">
              <Truck size={15} className="text-slate-400" />
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Flotă — 3 vehicule</span>
            </div>
            <table className="w-full text-xs">
              <thead><tr className="text-[10px] text-slate-400 uppercase tracking-wider">
                <th className="text-left py-1.5">Vehicul</th><th className="text-left py-1.5">RCA</th><th className="text-left py-1.5">ITP</th><th className="text-left py-1.5">Rov.</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  ['B 10 FLT', ['3 zile', 'text-red-600 bg-red-50'], ['ok', 'text-emerald-700'], ['ok', 'text-emerald-700']],
                  ['B 11 FLT', ['ok', 'text-emerald-700'], ['ok', 'text-emerald-700'], ['12 zile', 'text-amber-700 bg-amber-50']],
                  ['IF 05 CAR', ['expirat', 'text-red-600 bg-red-50'], ['45 zile', 'text-slate-500'], ['ok', 'text-emerald-700']],
                ].map(([plate, rca, itp, rov]) => (
                  <tr key={plate}>
                    <td className="py-2"><Plate plate={plate} size="sm" /></td>
                    <td className="py-2"><span className={`inline-block rounded-full px-2 py-0.5 font-semibold ${rca[1]}`}>{rca[0]}</span></td>
                    <td className="py-2"><span className={`inline-block rounded-full px-2 py-0.5 font-semibold ${itp[1]}`}>{itp[0]}</span></td>
                    <td className="py-2"><span className={`inline-block rounded-full px-2 py-0.5 font-semibold ${rov[1]}`}>{rov[0]}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ═══ PRICING ═══ */}
      <Section id="tarife">
        <div className="text-center">
          <SectionLabel>Tarife</SectionLabel>
          <SectionTitle className="mx-auto">Începi gratuit. Fără card.</SectionTitle>
          <p className="text-sm text-slate-500 mt-2">Upgrade la PRO oricând — sau gratuit la fiecare RCA cumpărat prin noi.</p>
        </div>

        <div className="mt-12 grid sm:grid-cols-3 gap-5 items-start">

          {/* Gratuit */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col">
            <div>
              <span className="text-4xl sm:text-5xl font-black text-slate-900" style={{ fontFamily: "'Archivo', sans-serif" }}>0</span>
              <span className="text-base font-semibold text-slate-400 ml-1.5">lei</span>
            </div>
            <p className="text-base font-bold text-slate-900 mt-2">Gratuit</p>
            <p className="text-sm text-slate-500 mt-1">1 vehicul, verificare unică, alerte email.</p>
            <div className="border-t border-slate-200 my-5" />
            <ul className="space-y-3 text-sm text-slate-600 flex-1">
              {[
                [Check, 'Verificare ITP, RCA, rovinietă'],
                [Mail, 'Notificări pe email'],
                [Car, '1 vehicul monitorizat'],
                [Search, 'Actualizare la cerere'],
              ].map(([Icon, label]) => (
                <li key={label} className="flex items-center gap-2.5">
                  <Icon size={15} className="text-slate-400 shrink-0" />{label}
                </li>
              ))}
            </ul>
            <Button variant="outline" className="w-full mt-6">Creează cont gratuit</Button>
          </div>

          {/* PRO — evidențiat, ridicat */}
          <div className="rounded-2xl border-2 p-6 flex flex-col relative sm:-mt-4 shadow-xl" style={{ borderColor: BLUE }}>
            <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-widest text-white rounded-full px-3 py-1 whitespace-nowrap" style={{ backgroundColor: BLUE }}>
              Recomandat
            </span>
            <div>
              <span className="text-4xl sm:text-5xl font-black text-slate-900" style={{ fontFamily: "'Archivo', sans-serif" }}>15</span>
              <span className="text-base font-semibold text-slate-400 ml-1.5">lei / an · vehicul</span>
            </div>
            <p className="text-base font-bold text-slate-900 mt-2">PRO</p>
            <p className="text-sm mt-1" style={{ color: BLUE }}>Gratuit cu RCA cumpărat prin noi.</p>
            <div className="border-t border-slate-200 my-5" />
            <ul className="space-y-3 text-sm text-slate-600 flex-1">
              {[
                [Check, 'Vehicule nelimitate'],
                [MessageSquare, 'Alerte email + SMS'],
                [Zap, 'Actualizare automată recurentă'],
                [Car, 'ITP, RCA, rovinietă + ARR'],
                [Bell, 'Alerte suplimentare (CASCO, service…)'],
                [Check, 'Dashboard flotă B2B'],
              ].map(([Icon, label]) => (
                <li key={label} className="flex items-center gap-2.5">
                  <Icon size={15} className="shrink-0" style={{ color: BLUE }} />{label}
                </li>
              ))}
            </ul>
            <Button variant="primary" className="w-full mt-6">Activează PRO</Button>
          </div>

          {/* Flotă */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col">
            <div>
              <span className="text-3xl sm:text-4xl font-black text-slate-900" style={{ fontFamily: "'Archivo', sans-serif" }}>Flotă</span>
            </div>
            <p className="text-base font-bold text-slate-900 mt-2">B2B</p>
            <p className="text-sm text-slate-500 mt-1">Factură pe CUI. Management centralizat.</p>
            <div className="border-t border-slate-200 my-5" />
            <ul className="space-y-3 text-sm text-slate-600 flex-1">
              {[
                [Check, 'Tot ce include PRO'],
                [Truck, 'Vehicule nelimitate per firmă'],
                [Users, 'Șoferi cu atestate și avize'],
                [Bell, 'Alerte ARR și tahograf'],
                [Check, 'Factură pe CUI'],
                [Check, 'Adăugare vehicule în bulk'],
              ].map(([Icon, label]) => (
                <li key={label} className="flex items-center gap-2.5">
                  <Icon size={15} className="text-slate-400 shrink-0" />{label}
                </li>
              ))}
            </ul>
            <Button variant="outline" className="w-full mt-6">Conectează firma</Button>
          </div>

        </div>
      </Section>

      {/* ═══ FAQ ═══ */}
      <Section id="faq" className="bg-slate-50 border-y border-slate-200">
        <div className="max-w-2xl mx-auto">
          <SectionLabel>Întrebări frecvente</SectionLabel>
          <SectionTitle>Tot ce trebuie să știi.</SectionTitle>
          <div className="mt-8">
            {faqData.map(([q, a]) => <FaqItem key={q} q={q} a={a} />)}
          </div>
        </div>
      </Section>

      {/* ═══ FINAL CTA ═══ */}
      <section className="py-16 sm:py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight" style={{ fontFamily: "'Archivo', sans-serif" }}>
            Nu mai uita de actele auto.
          </h2>
          <p className="text-sm text-slate-600 mt-2 max-w-md mx-auto">
            Creează un cont gratuit, adaugă mașina, și primești alerte înainte de expirare. 30 de secunde, zero bani.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button variant="primary" size="lg">Creează cont gratuit</Button>
            <Button variant="outline" size="lg" href="#tarife">Vezi tarifele</Button>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="border-t border-slate-200 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
            <div className="col-span-2 sm:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: BLUE }}>
                  <Shield className="text-white" size={14} />
                </span>
                <span className="font-extrabold text-sm" style={{ fontFamily: "'Archivo', sans-serif" }}>AutoDocs</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Verificare automată a actelor auto și alerte înainte de expirare. Pentru șoferi și flote.
              </p>
            </div>

            {[
              ['Verificări', [['Verificare ITP', '#'], ['Verificare RCA', '#'], ['Verificare Rovinietă', '#'], ['Calculator RCA', '#']]],
              ['Resurse', [['Amenzi auto 2026', '#'], ['Acte necesare', '#'], ['Stații ITP', '#'], ['Blog', '#']]],
              ['Legal', [['Termeni și Condiții', '#'], ['Confidențialitate', '#'], ['Contact', '#']]],
            ].map(([title, links]) => (
              <div key={title}>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">{title}</p>
                <ul className="space-y-2">
                  {links.map(([label, href]) => (
                    <li key={label}><a href={href} className="text-sm text-slate-600 hover:text-slate-900">{label}</a></li>
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
