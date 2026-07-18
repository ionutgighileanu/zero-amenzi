import React, { useState, useMemo } from 'react';
import {
  Car, Users, Shield, Plus, LogOut, X, Search,
  ArrowUpDown, ArrowUp, ArrowDown, Bell, Zap, Mail,
  MessageSquare, CheckCircle2, ChevronRight, Truck,
  ChevronDown, Check, Trash2, Settings
} from 'lucide-react';

/* ══════════════════════════════════════════════════════════════
   AUTODOCS — prototip vizual v2
   Semnătură vizuală: plăcuța de înmatriculare RO ca identitate
   a vehiculului, peste tot în interfață.
   Semafor calibrat: verdele e tăcut (punct + text), doar
   portocaliul și roșul „strigă". Managerul vede problemele întâi.
   Data de referință pentru statusuri: 15 iul 2026.
   ══════════════════════════════════════════════════════════════ */

const TODAY = new Date('2026-07-15');

/* ---------- MOCK DATA ---------- */
const MOCK_VEHICLES_B2C = [
  { id: 'c1', plate: 'B 100 ABC', vin: 'WAUZZZ8T0BA000001', isPremium: true,  itp: '2026-10-15', rca: '2026-07-20', rovinieta: '2027-01-05', docs: [{ type: 'Extinctor', expires: '2026-08-05' }, { type: 'Trusă medicală', expires: '2027-05-01' }] },
  { id: 'c2', plate: 'CJ 99 XYZ', vin: 'WVWZZZ1K0BW000002', isPremium: false, itp: '2027-02-10', rca: '2026-11-20', rovinieta: '2026-07-25', docs: [] },
  { id: 'c3', plate: 'IS 07 DAN', vin: 'VF1RFB00X56000003', isPremium: false, itp: '2026-06-28', rca: '2026-09-14', rovinieta: '2026-12-01', docs: [{ type: 'Revizie / ulei', expires: '2026-09-30' }] },
];

const MOCK_VEHICLES_B2B = [
  { id: 'f1', plate: 'B 10 FLT',  vin: 'WAUZZZ11111111111', truck: false, itp: '2027-01-15', rca: '2026-07-18', rovinieta: '2026-12-05', tahograf: null },
  { id: 'f2', plate: 'B 11 FLT',  vin: 'WAUZZZ22222222222', truck: true,  itp: '2026-04-10', rca: '2026-08-20', rovinieta: '2026-07-16', tahograf: '2026-09-02', docs: [{ type: 'CASCO', expires: '2026-08-15' }, { type: 'Revizie', expires: '2026-07-19' }] },
  { id: 'f3', plate: 'B 12 FLT',  vin: 'WAUZZZ33333333333', truck: true,  itp: '2026-11-15', rca: '2027-02-20', rovinieta: '2027-03-05', tahograf: '2026-07-11' },
  { id: 'f4', plate: 'IF 05 CAR', vin: 'WAUZZZ44444444444', truck: false, itp: '2026-08-01', rca: '2026-07-10', rovinieta: '2026-10-10', tahograf: null },
  { id: 'f5', plate: 'B 77 LOG',  vin: 'WDB9634031L000005', truck: true,  itp: '2026-09-22', rca: '2026-10-30', rovinieta: '2026-08-19', tahograf: '2027-04-18', docs: [{ type: 'Leasing', expires: '2027-01-10' }, { type: 'Service', expires: '2026-09-01' }] },
  { id: 'f6', plate: 'GR 21 TRK', vin: 'XLRTE47MS0E000006', truck: true,  itp: '2027-03-08', rca: '2026-07-27', rovinieta: '2026-11-11', tahograf: '2026-12-01' },
  { id: 'f7', plate: 'B 09 VAN',  vin: 'WV1ZZZ7HZ8H000007', truck: false, itp: '2026-12-14', rca: '2026-12-02', rovinieta: '2027-01-22', tahograf: null },
];

const MOCK_DRIVERS = [
  { id: 'd1', name: 'Ion Popescu',   phone: '0722 123 456', certs: [{ type: 'Atestat ADR', expires: '2026-07-22' }, { type: 'Fișă medicală', expires: '2027-01-15' }] },
  { id: 'd2', name: 'Maria Ionescu', phone: '0733 987 654', certs: [{ type: 'Aviz psihologic', expires: '2026-05-10' }] },
  { id: 'd3', name: 'Andrei Vlad',   phone: '0745 220 118', certs: [{ type: 'Atestat marfă', expires: '2026-10-30' }, { type: 'Aviz psihologic', expires: '2026-07-24' }] },
];

const RCA_OFFERS = [
  { insurer: 'Grawe România',   price: 668, best: true },
  { insurer: 'Allianz Țiriac',  price: 689, best: false },
  { insurer: 'Generali',        price: 701, best: false },
  { insurer: 'Groupama',        price: 723, best: false },
  { insurer: 'Omniasig VIG',    price: 745, best: false },
];

/* ---------- HELPERS ---------- */
const daysUntil = (dateStr) => {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr) - TODAY) / 86400000);
};

const getStatus = (dateStr) => {
  const d = daysUntil(dateStr);
  if (d === null) return 'none';
  if (d < 0) return 'expired';
  if (d <= 15) return 'warning';
  return 'valid';
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('ro-RO', { day: '2-digit', month: 'short', year: 'numeric' });
};

/* Cel mai urgent document al unui vehicul — pentru sortarea „problems-first" */
const minDays = (v) => {
  const all = [v.rca, v.itp, v.rovinieta, v.tahograf].filter(Boolean).map(daysUntil);
  return Math.min(...all);
};
const vehicleStatus = (v) => {
  const d = minDays(v);
  if (d < 0) return 'expired';
  if (d <= 15) return 'warning';
  return 'valid';
};

/* ---------- SEMNĂTURA: plăcuța RO ---------- */
const Plate = ({ plate, size = 'md' }) => {
  const s = {
    sm: { band: 'w-4 text-[7px]',  text: 'text-[13px] px-2 py-0.5', star: 'text-[5px]' },
    md: { band: 'w-5 text-[8px]',  text: 'text-[15px] px-2.5 py-1', star: 'text-[6px]' },
    lg: { band: 'w-6 text-[10px]', text: 'text-lg px-3 py-1.5',     star: 'text-[7px]' },
  }[size];
  return (
    <span className="inline-flex items-stretch rounded-md overflow-hidden border border-slate-300 shadow-sm select-none shrink-0" style={{ fontFamily: "'Archivo', sans-serif" }}>
      <span className={`${s.band} flex flex-col items-center justify-center text-white font-bold leading-none gap-0.5`} style={{ backgroundColor: '#003399' }}>
        <span className={s.star} aria-hidden="true">★</span>
        <span>RO</span>
      </span>
      <span className={`${s.text} bg-white font-extrabold tracking-widest text-slate-900 leading-none flex items-center`}>
        {plate}
      </span>
    </span>
  );
};

/* ---------- STATUS: semafor calibrat ----------
   valid  → tăcut: punct verde + dată gri (nu concurează cu alertele)
   warning→ pastilă amber cu nr. de zile
   expired→ pastilă roșie, singurul element cu adevărat tare din ecran */
const StatusCell = ({ date }) => {
  const status = getStatus(date);
  const d = daysUntil(date);
  if (status === 'none') return <span className="text-slate-300 text-sm">—</span>;
  if (status === 'valid') return (
    <span className="inline-flex items-center gap-1.5 text-sm text-slate-500">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
      {formatDate(date)}
    </span>
  );
  if (status === 'warning') return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-1">
      {d === 0 ? 'Expiră azi' : `${d} ${d === 1 ? 'zi' : 'zile'}`}
      <span className="font-normal text-amber-600">· {formatDate(date)}</span>
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-red-600 rounded-full px-2.5 py-1">
      Expirat
      <span className="font-normal text-red-100">· {formatDate(date)}</span>
    </span>
  );
};

/* ---------- UI PRIMITIVES ---------- */
const Button = ({ children, variant = 'primary', size = 'md', className = '', onClick, type = 'button', disabled }) => {
  const base = 'inline-flex items-center justify-center font-semibold rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-700 disabled:opacity-50';
  const variants = {
    primary:  'bg-slate-900 text-white hover:bg-slate-700',
    blue:     'text-white hover:opacity-90',
    outline:  'bg-white text-slate-700 border border-slate-300 hover:border-slate-400 hover:bg-slate-50',
    danger:   'bg-red-600 text-white hover:bg-red-700',
    ghost:    'text-slate-500 hover:bg-slate-100 hover:text-slate-800',
  };
  const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm', lg: 'px-5 py-2.5 text-sm' };
  const style = variant === 'blue' ? { backgroundColor: '#003399' } : undefined;
  return (
    <button type={type} onClick={onClick} disabled={disabled} style={style} className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}>
      {children}
    </button>
  );
};

const Modal = ({ isOpen, onClose, title, subtitle, children, wide }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className={`bg-white rounded-2xl shadow-2xl w-full ${wide ? 'max-w-lg' : 'max-w-md'} max-h-[85vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
        role="dialog" aria-modal="true" aria-label={title}
      >
        <div className="flex justify-between items-start px-5 pt-5 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900" style={{ fontFamily: "'Archivo', sans-serif" }}>{title}</h3>
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} aria-label="Închide" className="p-1.5 -mr-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-700">
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
};

const Input = ({ label, hint, ...props }) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
    <input
      {...props}
      className="block w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-700 focus:border-blue-700"
    />
    {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
  </div>
);

/* ══════════════════ MODALE DE FLUX ══════════════════ */

/* Adăugare vehicul — doar 2 câmpuri, restul le aduce sistemul */
const AddVehicleModal = ({ isOpen, onClose, onSubmit }) => {
  const [plate, setPlate] = useState('');
  const [vin, setVin] = useState('');
  const close = () => { setPlate(''); setVin(''); onClose(); };
  const submit = (e) => { e.preventDefault(); onSubmit(plate.trim().toUpperCase(), vin.trim().toUpperCase()); close(); };
  return (
    <Modal isOpen={isOpen} onClose={close} title="Adaugă un vehicul" subtitle="Doar două câmpuri. Restul datelor le preluăm noi.">
      <form className="space-y-4" onSubmit={submit}>
        <Input label="Număr de înmatriculare" placeholder="B 100 ABC" required autoFocus value={plate} onChange={(e) => setPlate(e.target.value)} style={{ textTransform: 'uppercase' }} />
        <Input label="Serie șasiu (VIN)" placeholder="17 caractere" hint="O găsești în talon, rubrica E." required minLength={17} maxLength={17} value={vin} onChange={(e) => setVin(e.target.value)} style={{ textTransform: 'uppercase' }} />
        <div className="flex items-start gap-2.5 bg-slate-50 border border-slate-200 rounded-lg p-3">
          <Zap size={16} className="text-blue-700 shrink-0 mt-0.5" />
          <p className="text-xs text-slate-600 leading-relaxed">
            Verificăm automat ITP, RCA și rovinieta în bazele oficiale și îți setăm alertele. Nu introduci nicio dată manual.
          </p>
        </div>
        <div className="pt-2 flex gap-3">
          <Button variant="outline" onClick={close} className="flex-1">Anulează</Button>
          <Button type="submit" variant="blue" className="flex-1">Verifică și adaugă</Button>
        </div>
      </form>
    </Modal>
  );
};

/* RCA — lista de oferte în stilul cu care sunt obișnuiți românii */
const RcaModal = ({ vehicle, onClose }) => {
  const [chosen, setChosen] = useState(null);
  if (!vehicle) return null;
  return (
    <Modal isOpen onClose={onClose} title="Reînnoiește RCA" subtitle="Oferte în timp real de la asigurători, pentru 12 luni." wide>
      <div className="mb-4"><Plate plate={vehicle.plate} size="sm" /></div>
      {chosen ? (
        <div className="text-center py-6">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-emerald-100 mb-4">
            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
          </div>
          <h4 className="text-base font-bold text-slate-900 mb-1">Poliță {chosen.insurer} selectată</h4>
          <p className="text-sm text-slate-500 mb-6">Urmează pagina securizată de plată. După confirmare, data RCA se actualizează automat în cont.</p>
          <Button variant="blue" onClick={onClose} className="w-full">Continuă spre plată · {chosen.price} lei</Button>
        </div>
      ) : (
        <ul className="space-y-2">
          {RCA_OFFERS.map((o) => (
            <li key={o.insurer}>
              <button
                onClick={() => setChosen(o)}
                className={`w-full flex items-center justify-between gap-3 rounded-xl border p-3.5 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 ${o.best ? 'border-blue-700 bg-blue-50/50' : 'border-slate-200 hover:border-slate-400'}`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-900">{o.insurer}</span>
                    {o.best && <span className="text-[10px] font-bold uppercase tracking-wide text-white rounded px-1.5 py-0.5" style={{ backgroundColor: '#003399' }}>Cel mai bun preț</span>}
                  </div>
                  <span className="text-xs text-slate-400">Valabilitate 12 luni · emitere instant</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-base font-bold text-slate-900" style={{ fontFamily: "'Archivo', sans-serif" }}>{o.price} lei</span>
                  <ChevronRight size={16} className="text-slate-400" />
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
};

/* CASCO — lead scurt către broker, nu vânzare directă */
const CascoModal = ({ vehicle, onClose }) => {
  const [sent, setSent] = useState(false);
  if (!vehicle) return null;
  return (
    <Modal isOpen onClose={onClose} title="Cere ofertă CASCO" subtitle="Trei întrebări. Brokerul partener revine cu oferte pe email.">
      <div className="mb-4"><Plate plate={vehicle.plate} size="sm" /></div>
      {sent ? (
        <div className="text-center py-6">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-emerald-100 mb-4">
            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
          </div>
          <h4 className="text-base font-bold text-slate-900 mb-1">Cerere trimisă</h4>
          <p className="text-sm text-slate-500 mb-6">Primești ofertele comparate pe email, de regulă în aceeași zi lucrătoare.</p>
          <Button onClick={onClose} className="w-full">Am înțeles</Button>
        </div>
      ) : (
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setSent(true); }}>
          <Input label="Valoare estimată a mașinii (EUR)" type="number" placeholder="ex: 14 500" required />
          <Input label="Anul primei înmatriculări" type="number" placeholder="ex: 2021" required />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Daune în ultimii 3 ani</label>
            <div className="grid grid-cols-3 gap-2">
              {['Nicio daună', '1 daună', '2+ daune'].map((opt, i) => (
                <label key={opt} className="flex items-center justify-center gap-1.5 border border-slate-300 rounded-lg py-2 text-xs font-medium text-slate-700 cursor-pointer has-[:checked]:border-blue-700 has-[:checked]:bg-blue-50/50 has-[:checked]:text-blue-900">
                  <input type="radio" name="daune" defaultChecked={i === 0} className="sr-only" />
                  {opt}
                </label>
              ))}
            </div>
          </div>
          <div className="pt-2 flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">Anulează</Button>
            <Button type="submit" variant="blue" className="flex-1">Trimite cererea</Button>
          </div>
        </form>
      )}
    </Modal>
  );
};

const AddDriverModal = ({ isOpen, onClose, onSubmit }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const close = () => { setName(''); setPhone(''); onClose(); };
  const submit = (e) => { e.preventDefault(); onSubmit(name.trim(), phone.trim()); close(); };
  return (
    <Modal isOpen={isOpen} onClose={close} title="Adaugă un șofer" subtitle="Atestatele și avizele le atașezi după salvare.">
      <form className="space-y-4" onSubmit={submit}>
        <Input label="Nume complet" placeholder="Ion Popescu" required autoFocus value={name} onChange={(e) => setName(e.target.value)} />
        <Input label="Telefon" type="tel" placeholder="0722 123 456" required value={phone} onChange={(e) => setPhone(e.target.value)} />
        <div className="pt-2 flex gap-3">
          <Button variant="outline" onClick={close} className="flex-1">Anulează</Button>
          <Button type="submit" variant="blue" className="flex-1">Salvează șoferul</Button>
        </div>
      </form>
    </Modal>
  );
};

/* ---------- Alerte suplimentare (fleet-wide) ---------- */
const PRESET_ALERTS = ['Stingător', 'Trusă medicală', 'Service', 'CASCO', 'Leasing', 'Revizie', 'Impozit auto', 'Verificare stingător'];
const MAX_ALERTS = 15;

const AlertTypesModal = ({ selected, onSave, onClose }) => {
  const [local, setLocal] = useState(selected);
  const [custom, setCustom] = useState('');
  const all = [...new Set([...PRESET_ALERTS, ...local])];
  const toggle = (t) => setLocal((l) => l.includes(t) ? l.filter((x) => x !== t) : (l.length >= MAX_ALERTS ? l : [...l, t]));
  const addCustom = () => { const t = custom.trim(); if (t && !local.includes(t) && local.length < MAX_ALERTS) { setLocal([...local, t]); setCustom(''); } };
  return (
    <Modal isOpen onClose={onClose} title="Selectează tipuri de alerte" subtitle="Se aplică tuturor vehiculelor din flotă." wide>
      <div className="flex flex-wrap gap-2">
        {all.map((t) => {
          const on = local.includes(t);
          return (
            <button key={t} onClick={() => toggle(t)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 ${on ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : 'border-slate-300 text-slate-600 hover:border-slate-400'}`}>
              {on && <Check size={14} />} {t}
            </button>
          );
        })}
      </div>

      <div className="mt-4 bg-slate-50 border border-slate-200 rounded-xl p-3">
        <label className="block text-xs font-medium text-slate-600 mb-1.5">Adaugă alertă personalizată</label>
        <div className="flex gap-2">
          <input
            value={custom} onChange={(e) => setCustom(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustom(); } }}
            placeholder="Ex: Schimb roți" maxLength={30}
            className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700"
          />
          <Button variant="blue" onClick={addCustom} disabled={!custom.trim() || local.length >= MAX_ALERTS} aria-label="Adaugă"><Plus size={16} /></Button>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-center gap-2 text-sm font-semibold rounded-lg py-2 bg-blue-50" style={{ color: '#003399' }}>
        <Bell size={14} /> {local.length} / {MAX_ALERTS} alerte selectate
      </div>

      <div className="mt-4 flex gap-3">
        <Button variant="outline" className="flex-1" onClick={onClose}>Anulează</Button>
        <Button variant="blue" className="flex-1" onClick={() => { onSave(local); onClose(); }}>Salvează</Button>
      </div>
    </Modal>
  );
};

/* ══════════════════ PANOU DE DETALII (card centrat) ══════════════════ */
const DetailModal = ({ onClose, title, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}>
    <div
      className="bg-white w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[85vh]"
      onClick={(e) => e.stopPropagation()}
      role="dialog" aria-modal="true" aria-label={title}
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
        <h3 className="text-base font-bold text-slate-900" style={{ fontFamily: "'Archivo', sans-serif" }}>{title}</h3>
        <button onClick={onClose} aria-label="Închide" className="p-1.5 -mr-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"><X size={18} /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-5">{children}</div>
    </div>
  </div>
);

const AddDocForm = ({ presets, onAdd, onCancel }) => {
  const [type, setType] = useState(presets[0]);
  const [custom, setCustom] = useState('');
  const [date, setDate] = useState('');
  const finalType = type === 'Altul' ? custom.trim() : type;
  const submit = (e) => { e.preventDefault(); if (!finalType || !date) return; onAdd({ type: finalType, expires: date }); };
  return (
    <form onSubmit={submit} className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-3">
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Tip document</label>
        <select value={type} onChange={(e) => setType(e.target.value)} className="w-full border border-slate-300 rounded-lg px-2.5 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-700">
          {presets.map((p) => <option key={p}>{p}</option>)}
        </select>
      </div>
      {type === 'Altul' && (
        <input value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="Denumire document" className="w-full border border-slate-300 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700" />
      )}
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Expiră la</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full border border-slate-300 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700" />
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" className="flex-1" onClick={onCancel}>Renunță</Button>
        <Button type="submit" variant="blue" size="sm" className="flex-1" disabled={!finalType || !date}>Adaugă</Button>
      </div>
    </form>
  );
};

const DeleteConfirm = ({ label, onConfirm }) => {
  const [armed, setArmed] = useState(false);
  if (!armed) return (
    <button onClick={() => setArmed(true)} className="inline-flex items-center gap-1.5 text-sm font-medium text-red-600 hover:text-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-600 rounded">
      <Trash2 size={15} /> {label}
    </button>
  );
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-slate-600">Sigur?</span>
      <Button size="sm" variant="outline" onClick={() => setArmed(false)}>Nu</Button>
      <Button size="sm" variant="danger" onClick={onConfirm}>Da, șterge</Button>
    </div>
  );
};

const DocLine = ({ label, date, onDelete, action }) => (
  <div className="flex items-center justify-between gap-2 py-2.5 border-b border-slate-100 last:border-0">
    <span className="text-sm text-slate-600">{label}</span>
    <div className="flex items-center gap-1.5">
      <StatusCell date={date} />
      {action}
      {onDelete && (
        <button onClick={onDelete} aria-label={`Șterge ${label}`} className="p-1 text-slate-300 hover:text-red-600 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-red-600"><X size={14} /></button>
      )}
    </div>
  </div>
);

const VehicleDetail = ({ vehicle, isB2B, alertTypes = [], onRca, onCasco, onAddDoc, onDeleteDoc, onDelete, onClose }) => {
  const [adding, setAdding] = useState(false);
  const extra = vehicle.docs || [];
  const presets = [...new Set([...alertTypes, 'Altul'])];
  return (
    <DetailModal onClose={onClose} title="Detalii vehicul">
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-3">
            <Plate plate={vehicle.plate} size="lg" />
            {vehicle.truck && <span className="inline-flex items-center gap-1 text-xs text-slate-500"><Truck size={14} /> Camion</span>}
          </div>
          <p className="text-xs text-slate-400 font-mono mt-2">{vehicle.vin}</p>
        </div>

        <section>
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Documente obligatorii</h4>
          <DocLine label="RCA" date={vehicle.rca} action={<Button size="sm" variant="ghost" onClick={() => onRca(vehicle)}>Reînnoiește</Button>} />
          <DocLine label="ITP" date={vehicle.itp} />
          <DocLine label="Rovinietă" date={vehicle.rovinieta} />
          {isB2B && vehicle.truck && <DocLine label="Tahograf" date={vehicle.tahograf} />}
        </section>

        <section>
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Alerte suplimentare</h4>
            {!adding && (
              <button onClick={() => setAdding(true)} className="text-sm font-semibold inline-flex items-center gap-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 rounded" style={{ color: '#003399' }}>
                <Plus size={14} /> Adaugă
              </button>
            )}
          </div>
          {extra.length === 0 && !adding && (
            <p className="text-sm text-slate-400 py-2">Extinctor, trusă medicală, revizie, CASCO, impozit auto… adaugă ce vrei să nu uiți.</p>
          )}
          {extra.map((d, i) => <DocLine key={i} label={d.type} date={d.expires} onDelete={() => onDeleteDoc(vehicle.id, i)} />)}
          {adding && (
            <div className="mt-2">
              <AddDocForm
                presets={presets}
                onAdd={(doc) => { onAddDoc(vehicle.id, doc); setAdding(false); }}
                onCancel={() => setAdding(false)}
              />
            </div>
          )}
        </section>

        <div className="flex gap-2">
          <Button variant="blue" className="flex-1" onClick={() => onRca(vehicle)}>Reînnoiește RCA</Button>
          <Button variant="outline" className="flex-1" onClick={() => onCasco(vehicle)}>Ofertă CASCO</Button>
        </div>

        <div className="pt-4 border-t border-slate-100">
          <DeleteConfirm label="Șterge vehiculul" onConfirm={() => { onDelete(vehicle.id); onClose(); }} />
        </div>
      </div>
    </DetailModal>
  );
};

const DriverDetail = ({ driver, onUpdate, onAddCert, onDeleteCert, onDelete, onClose }) => {
  const [name, setName] = useState(driver.name);
  const [phone, setPhone] = useState(driver.phone);
  const [adding, setAdding] = useState(false);
  const dirty = name.trim() !== driver.name || phone.trim() !== driver.phone;
  return (
    <DetailModal onClose={onClose} title="Detalii șofer">
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <span className="h-11 w-11 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0" style={{ backgroundColor: '#003399' }}>
            {driver.name.split(' ').map((p) => p[0]).join('')}
          </span>
          <div className="min-w-0">
            <p className="text-base font-bold text-slate-900 truncate">{driver.name}</p>
            <p className="text-sm text-slate-500">{driver.phone}</p>
          </div>
        </div>

        <section className="space-y-3">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Date de contact</h4>
          <Input label="Nume complet" value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="Telefon" value={phone} onChange={(e) => setPhone(e.target.value)} />
          {dirty && <Button size="sm" variant="blue" onClick={() => onUpdate(driver.id, { name: name.trim(), phone: phone.trim() })}>Salvează modificările</Button>}
        </section>

        <section>
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Atestate și avize</h4>
            {!adding && (
              <button onClick={() => setAdding(true)} className="text-sm font-semibold inline-flex items-center gap-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 rounded" style={{ color: '#003399' }}>
                <Plus size={14} /> Adaugă
              </button>
            )}
          </div>
          {driver.certs.length === 0 && !adding && (
            <p className="text-sm text-slate-400 py-2">Niciun document. Adaugă atestate ADR, avize psihologice, fișe medicale…</p>
          )}
          {driver.certs.map((c, i) => (
            <DocLine key={i} label={c.type} date={c.expires} onDelete={() => onDeleteCert(driver.id, i)} />
          ))}
          {adding && (
            <div className="mt-2">
              <AddDocForm
                presets={['Atestat ADR', 'Atestat marfă', 'Aviz psihologic', 'Fișă medicală', 'Altul']}
                onAdd={(doc) => { onAddCert(driver.id, doc); setAdding(false); }}
                onCancel={() => setAdding(false)}
              />
            </div>
          )}
        </section>

        <div className="pt-4 border-t border-slate-100">
          <DeleteConfirm label="Șterge șoferul" onConfirm={() => { onDelete(driver.id); onClose(); }} />
        </div>
      </div>
    </DetailModal>
  );
};

/* ══════════════════ LOGIN ══════════════════ */
const LoginView = ({ onLogin }) => {
  const [mode, setMode] = useState('signup'); // signup | login
  const [account, setAccount] = useState('B2C'); // B2C | B2B

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4">
      <div className="mx-auto w-full max-w-sm">
        <div className="flex items-center justify-center gap-2.5 mb-2">
          <span className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#003399' }}>
            <Shield className="text-white" size={22} />
          </span>
          <span className="text-2xl font-extrabold tracking-tight text-slate-900" style={{ fontFamily: "'Archivo', sans-serif" }}>AutoDocs</span>
        </div>
        <p className="text-center text-sm text-slate-500 mb-8">
          Documentele auto, verificate automat.<br />Alertate înainte să coste.
        </p>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          {mode === 'signup' && (
            <div className="mb-5">
              <span className="block text-sm font-medium text-slate-700 mb-2">Ce fel de cont deschizi?</span>
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
                {[['B2C', 'Persoană fizică', Car], ['B2B', 'Firmă', Truck]].map(([id, label, Icon]) => (
                  <button
                    key={id} onClick={() => setAccount(id)}
                    className={`inline-flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 ${account === id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    <Icon size={15} /> {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); onLogin(account); }}>
            {mode === 'signup' && account === 'B2B' && (
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2"><Input label="Nume firmă" placeholder="TransLog SRL" required /></div>
                <Input label="CUI" placeholder="RO12345678" required />
              </div>
            )}
            <Input label="Email" type="email" placeholder="nume@email.ro" required />
            <Input label="Parolă" type="password" placeholder="••••••••" required />
            <Button type="submit" variant="blue" className="w-full">
              {mode === 'signup' ? 'Creează cont' : 'Intră în cont'}
            </Button>
          </form>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200" /></div>
            <div className="relative flex justify-center"><span className="bg-white px-3 text-xs text-slate-400">sau</span></div>
          </div>
          <Button variant="outline" className="w-full" onClick={() => onLogin(account)}>
            <svg width="16" height="16" viewBox="0 0 24 24" className="mr-2" aria-hidden="true"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.1a7.15 7.15 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"/><path fill="#EA4335" d="M12 4.75c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.99 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            {mode === 'signup' ? 'Înscrie-te cu Google' : 'Continuă cu Google'}
          </Button>
        </div>

        <p className="text-center text-sm text-slate-500 mt-6">
          {mode === 'signup' ? 'Ai deja cont?' : 'Nu ai cont încă?'}{' '}
          <button
            onClick={() => setMode(mode === 'signup' ? 'login' : 'signup')}
            className="font-semibold hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 rounded"
            style={{ color: '#003399' }}
          >
            {mode === 'signup' ? 'Autentifică-te' : 'Creează unul'}
          </button>
        </p>
      </div>
    </div>
  );
};

/* ══════════════════ B2C — CARDURI ══════════════════ */
const B2CDashboard = ({ vehicles, onRca, onCasco, onAdd, onOpen }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
    {vehicles.map((v) => {
      const vStatus = vehicleStatus(v);
      return (
        <div
          key={v.id}
          onClick={() => onOpen(v)}
          className={`bg-white rounded-2xl border shadow-sm flex flex-col overflow-hidden cursor-pointer hover:shadow-md transition-shadow ${vStatus === 'expired' ? 'border-red-300' : vStatus === 'warning' ? 'border-amber-300' : 'border-slate-200'}`}
        >
          <div className="p-5 pb-4 flex items-start justify-between gap-3">
            <div>
              <Plate plate={v.plate} size="md" />
              <p className="text-[11px] text-slate-400 font-mono mt-2 tracking-wide">{v.vin}</p>
            </div>
            {vStatus === 'expired' && <span className="text-[10px] font-bold uppercase tracking-wide text-red-700 bg-red-50 border border-red-200 rounded-full px-2 py-1 shrink-0">Acțiune necesară</span>}
            {vStatus === 'warning' && <span className="text-[10px] font-bold uppercase tracking-wide text-amber-800 bg-amber-50 border border-amber-200 rounded-full px-2 py-1 shrink-0">Expiră curând</span>}
          </div>

          <div className="px-5 flex-1">
            {[['RCA', v.rca], ['ITP', v.itp], ['Rovinietă', v.rovinieta]].map(([label, date]) => (
              <div key={label} className="flex justify-between items-center py-2.5 border-b border-slate-100 last:border-0">
                <span className="text-sm text-slate-500">{label}</span>
                <StatusCell date={date} />
              </div>
            ))}
            {(v.docs || []).length > 0 && (
              <div className="flex justify-between items-center py-2.5">
                <span className="text-sm text-slate-500">Alte documente</span>
                <span className="text-xs text-slate-400">{v.docs.length} adăugate</span>
              </div>
            )}
          </div>

          <div className="px-5 pt-1">
            <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-400">Detalii, editare, ștergere <ChevronRight size={13} /></span>
          </div>

          <div className="p-5 pt-3 flex gap-2">
            <Button
              variant={getStatus(v.rca) === 'expired' ? 'danger' : getStatus(v.rca) === 'warning' ? 'blue' : 'outline'}
              className="flex-1" onClick={(e) => { e.stopPropagation(); onRca(v); }}
            >
              Reînnoiește RCA
            </Button>
            <Button variant="ghost" onClick={(e) => { e.stopPropagation(); onCasco(v); }}>CASCO</Button>
          </div>

          {/* Free vs Premium — diferența e explicită, nu doar un badge */}
          {v.isPremium ? (
            <div className="px-5 py-3 border-t border-blue-100 bg-blue-50/60 flex items-center gap-2 text-xs font-medium" style={{ color: '#003399' }}>
              <Zap size={13} /> Premium · sincronizare lunară automată
              <span className="ml-auto flex items-center gap-1 text-blue-700/70"><MessageSquare size={12} /> SMS</span>
            </div>
          ) : (
            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex items-center gap-2 text-xs text-slate-500">
              <Mail size={13} /> Free · verificare unică, alerte email
              <button onClick={(e) => e.stopPropagation()} className="ml-auto font-semibold hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 rounded" style={{ color: '#003399' }}>
                Premium · 15 lei/an
              </button>
            </div>
          )}
        </div>
      );
    })}

    {/* Empty-slot: invitație la acțiune, nu decor */}
    <button onClick={onAdd} className="min-h-[280px] rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 hover:border-slate-400 hover:text-slate-600 transition-colors flex flex-col items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-700">
      <Plus size={22} />
      <span className="text-sm font-medium">Adaugă o mașină</span>
      <span className="text-xs">Număr + serie șasiu. Atât.</span>
    </button>
  </div>
);

/* ══════════════════ B2B — TABEL ══════════════════ */
const SortHeader = ({ label, col, sort, setSort, align = 'left' }) => {
  const active = sort.col === col;
  const Icon = !active ? ArrowUpDown : sort.dir === 'asc' ? ArrowUp : ArrowDown;
  return (
    <th className={`px-4 py-3 text-${align}`}>
      <button
        onClick={() => setSort({ col, dir: active && sort.dir === 'asc' ? 'desc' : 'asc' })}
        className={`inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 rounded ${active ? 'text-slate-900' : 'text-slate-400'}`}
      >
        {label} <Icon size={12} />
      </button>
    </th>
  );
};

const B2BDashboard = ({ tab, setTab, vehicles, drivers, onRca, onCasco, onOpenVehicle, onOpenDriver }) => {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all'); // all | problems | expired
  const [sort, setSort] = useState({ col: 'urgency', dir: 'asc' });

  const counts = useMemo(() => ({
    expired: vehicles.filter((v) => vehicleStatus(v) === 'expired').length,
    warning: vehicles.filter((v) => vehicleStatus(v) === 'warning').length,
    valid:   vehicles.filter((v) => vehicleStatus(v) === 'valid').length,
  }), [vehicles]);

  const rows = useMemo(() => {
    let list = vehicles.filter((v) =>
      v.plate.toLowerCase().includes(query.toLowerCase()) || v.vin.toLowerCase().includes(query.toLowerCase())
    );
    if (filter === 'problems') list = list.filter((v) => vehicleStatus(v) !== 'valid');
    if (filter === 'expired')  list = list.filter((v) => vehicleStatus(v) === 'expired');
    const dir = sort.dir === 'asc' ? 1 : -1;
    const key = { urgency: minDays, rca: (v) => daysUntil(v.rca), itp: (v) => daysUntil(v.itp), rovinieta: (v) => daysUntil(v.rovinieta), tahograf: (v) => daysUntil(v.tahograf) ?? 99999 }[sort.col] || minDays;
    return [...list].sort((a, b) => (key(a) - key(b)) * dir);
  }, [vehicles, query, filter, sort]);

  const kpis = [
    { id: 'expired',  label: 'Expirate',        value: counts.expired, tone: 'text-red-600' },
    { id: 'problems', label: 'Expiră ≤ 15 zile', value: counts.warning, tone: 'text-amber-600' },
    { id: 'all',      label: 'În regulă',        value: counts.valid,   tone: 'text-slate-900' },
  ];

  return (
    <div className="space-y-5">
      {/* KPI — răspunsul la „ce arde azi?", filtrele sunt chiar cifrele */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {kpis.map((k) => (
          <button
            key={k.id}
            onClick={() => setFilter(filter === k.id ? 'all' : k.id)}
            className={`bg-white rounded-xl border p-4 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 ${filter === k.id && k.id !== 'all' ? 'border-slate-900' : 'border-slate-200 hover:border-slate-400'}`}
          >
            <div className={`text-2xl sm:text-3xl font-extrabold ${k.tone}`} style={{ fontFamily: "'Archivo', sans-serif" }}>{k.value}</div>
            <div className="text-xs text-slate-500 mt-1">{k.label}</div>
          </button>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {/* Tabs + căutare */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 pt-4 pb-0 sm:pb-4 border-b border-slate-100">
          <nav className="flex gap-6" aria-label="Secțiuni">
            {[['vehicles', 'Vehicule', vehicles.length, Car], ['drivers', 'Șoferi', drivers.length, Users]].map(([id, label, n, Icon]) => (
              <button
                key={id} onClick={() => setTab(id)}
                className={`pb-3 sm:pb-0 inline-flex items-center gap-2 text-sm font-semibold border-b-2 sm:border-b-0 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 rounded-sm ${tab === id ? 'text-slate-900 border-slate-900' : 'text-slate-400 border-transparent hover:text-slate-600'}`}
              >
                <Icon size={16} /> {label}
                <span className={`text-[11px] font-bold rounded-full px-1.5 py-0.5 ${tab === id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'}`}>{n}</span>
              </button>
            ))}
          </nav>
          {tab === 'vehicles' && (
            <div className="relative sm:ml-auto pb-3 sm:pb-0">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 sm:-translate-y-1/2 -mt-1.5 sm:mt-0 text-slate-400 pointer-events-none" />
              <input
                value={query} onChange={(e) => setQuery(e.target.value)}
                placeholder="Caută număr sau VIN"
                className="w-full sm:w-64 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-700 focus:border-blue-700"
              />
            </div>
          )}
        </div>

        {tab === 'vehicles' ? (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-slate-50/70">
                <tr>
                  <SortHeader label="Vehicul" col="urgency" sort={sort} setSort={setSort} />
                  <SortHeader label="RCA" col="rca" sort={sort} setSort={setSort} />
                  <SortHeader label="ITP" col="itp" sort={sort} setSort={setSort} />
                  <SortHeader label="Rovinietă" col="rovinieta" sort={sort} setSort={setSort} />
                  <SortHeader label="Tahograf" col="tahograf" sort={sort} setSort={setSort} />
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((v) => (
                  <tr key={v.id} onClick={() => onOpenVehicle(v)} className="hover:bg-slate-50/60 transition-colors cursor-pointer">
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <Plate plate={v.plate} size="sm" />
                        {v.truck && <Truck size={14} className="text-slate-300" aria-label="Camion" />}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap"><StatusCell date={v.rca} /></td>
                    <td className="px-4 py-3.5 whitespace-nowrap"><StatusCell date={v.itp} /></td>
                    <td className="px-4 py-3.5 whitespace-nowrap"><StatusCell date={v.rovinieta} /></td>
                    <td className="px-4 py-3.5 whitespace-nowrap"><StatusCell date={v.tahograf} /></td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-right">
                      <div className="inline-flex items-center gap-1.5">
                        {getStatus(v.rca) !== 'valid' && (
                          <Button size="sm" variant={getStatus(v.rca) === 'expired' ? 'danger' : 'blue'} onClick={(e) => { e.stopPropagation(); onRca(v); }}>RCA</Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); onCasco(v); }}>CASCO</Button>
                        <ChevronRight size={16} className="text-slate-300" />
                      </div>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-slate-400">
                    Niciun vehicul nu se potrivește. Șterge căutarea sau filtrul activ.
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-slate-50/70">
                <tr>
                  {['Șofer', 'Telefon', 'Atestate și avize', ''].map((h, i) => (
                    <th key={i} className={`px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400 ${i === 3 ? 'text-right' : ''}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {drivers.map((d) => (
                  <tr key={d.id} onClick={() => onOpenDriver(d)} className="hover:bg-slate-50/60 transition-colors cursor-pointer">
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <span className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ backgroundColor: '#003399' }}>
                          {d.name.split(' ').map((p) => p[0]).join('')}
                        </span>
                        <span className="text-sm font-semibold text-slate-900">{d.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-sm text-slate-500">{d.phone}</td>
                    <td className="px-4 py-3.5">
                      {d.certs.length === 0 ? (
                        <span className="text-sm text-slate-400">Fără documente încă</span>
                      ) : (
                        <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                          {d.certs.map((c) => (
                            <span key={c.type} className="inline-flex items-center gap-1.5 text-sm text-slate-600">
                              {c.type} <StatusCell date={c.expires} />
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-right">
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-400">Detalii <ChevronRight size={14} /></span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

/* ---------- Context / space switcher ---------- */
const ContextSwitcher = ({ spaces, current, onSelect }) => {
  const [open, setOpen] = useState(false);
  const active = spaces.find((s) => s.id === current);
  const ActiveIcon = active.icon;
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
        aria-haspopup="menu" aria-expanded={open}
      >
        <ActiveIcon size={15} className="text-slate-500" />
        <span className="text-sm font-semibold text-slate-800 max-w-[9rem] truncate">{active.name}</span>
        <ChevronDown size={14} className="text-slate-400" />
      </button>
      {open && (
        <>
          <button className="fixed inset-0 z-40 cursor-default" aria-hidden="true" onClick={() => setOpen(false)} />
          <div className="absolute left-0 mt-1.5 w-64 bg-white rounded-xl border border-slate-200 shadow-lg z-50 p-1.5" role="menu">
            <p className="px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Spațiile tale</p>
            {spaces.map((s) => {
              const Icon = s.icon;
              return (
                <button
                  key={s.id} role="menuitem"
                  onClick={() => { onSelect(s.id); setOpen(false); }}
                  className="w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
                >
                  <span className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0"><Icon size={15} className="text-slate-600" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-slate-800 truncate">{s.name}</span>
                    <span className="block text-xs text-slate-400">{s.kind}</span>
                  </span>
                  {s.id === current && <Check size={16} className="text-blue-700 shrink-0" />}
                </button>
              );
            })}
            <div className="border-t border-slate-100 my-1.5" />
            <button role="menuitem" className="w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-slate-500 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-700">
              <span className="w-7 h-7 rounded-lg border border-dashed border-slate-300 flex items-center justify-center shrink-0"><Plus size={14} /></span>
              <span className="text-sm font-medium">Conectează o firmă</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};

/* ══════════════════ APP ══════════════════ */
export default function App() {
  const [user, setUser] = useState(null);
  const [context, setContext] = useState('personal'); // 'personal' | org id
  const [b2bTab, setB2bTab] = useState('vehicles');    // vehicles | drivers
  const [vehiclesB2C, setVehiclesB2C] = useState(MOCK_VEHICLES_B2C);
  const [vehiclesB2B, setVehiclesB2B] = useState(MOCK_VEHICLES_B2B);
  const [drivers, setDrivers] = useState(MOCK_DRIVERS);
  const [alertTypes, setAlertTypes] = useState(['Stingător', 'Trusă medicală', 'Service', 'CASCO', 'Leasing', 'Revizie']);
  const [addVehicleOpen, setAddVehicleOpen] = useState(false);
  const [addDriverOpen, setAddDriverOpen] = useState(false);
  const [rcaVehicle, setRcaVehicle] = useState(null);
  const [cascoVehicle, setCascoVehicle] = useState(null);
  const [detailVehicleId, setDetailVehicleId] = useState(null);
  const [detailDriverId, setDetailDriverId] = useState(null);
  const [alertModalOpen, setAlertModalOpen] = useState(false);

  const fonts = (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Archivo:wght@500;700;800&family=Inter:wght@400;500;600;700&display=swap');
      body { font-family: 'Inter', system-ui, sans-serif; }
      @media (prefers-reduced-motion: reduce) { * { transition: none !important; animation: none !important; } }
    `}</style>
  );

  const handleLogin = (type) => {
    // O identitate are mereu un garaj personal; poate aparține și unor flote.
    setUser({
      name: 'Andrei Popa',
      email: 'andrei.popa@gmail.com',
      orgs: [{ id: 'translog', name: 'TransLog SRL' }],
    });
    setContext(type === 'B2B' ? 'translog' : 'personal');
  };

  if (!user) return <>{fonts}<LoginView onLogin={handleLogin} /></>;

  const spaces = [
    { id: 'personal', name: 'Garajul meu', kind: 'Persoană fizică', icon: Car },
    ...user.orgs.map((o) => ({ id: o.id, name: o.name, kind: 'Flotă', icon: Truck })),
  ];
  const isB2B = context !== 'personal';
  const activeSpace = spaces.find((s) => s.id === context);
  const vehicles = isB2B ? vehiclesB2B : vehiclesB2C;
  const problemCount = vehicles.filter((v) => vehicleStatus(v) !== 'valid').length;

  // La adăugare, „sistemul" a verificat deja actele → date plauzibile, status valid.
  const inDays = (n) => new Date(TODAY.getTime() + n * 86400000).toISOString().slice(0, 10);
  const addVehicle = (plate, vin) => {
    const nv = { id: 'v' + Date.now(), plate, vin, isPremium: false, truck: false,
      itp: inDays(280), rca: inDays(150), rovinieta: inDays(210), tahograf: null };
    (isB2B ? setVehiclesB2B : setVehiclesB2C)((list) => [nv, ...list]);
  };
  const addDriver = (name, phone) => {
    setDrivers((list) => [...list, { id: 'd' + Date.now(), name, phone, certs: [] }]);
  };

  const setActiveVehicles = isB2B ? setVehiclesB2B : setVehiclesB2C;
  const deleteVehicle = (id) => setActiveVehicles((list) => list.filter((v) => v.id !== id));
  const addVehicleDoc = (id, doc) => setActiveVehicles((list) => list.map((v) => v.id === id ? { ...v, docs: [...(v.docs || []), doc] } : v));
  const deleteVehicleDoc = (id, idx) => setActiveVehicles((list) => list.map((v) => v.id === id ? { ...v, docs: (v.docs || []).filter((_, i) => i !== idx) } : v));

  const deleteDriver = (id) => setDrivers((list) => list.filter((d) => d.id !== id));
  const updateDriver = (id, patch) => setDrivers((list) => list.map((d) => d.id === id ? { ...d, ...patch } : d));
  const addDriverCert = (id, cert) => setDrivers((list) => list.map((d) => d.id === id ? { ...d, certs: [...d.certs, cert] } : d));
  const deleteDriverCert = (id, idx) => setDrivers((list) => list.map((d) => d.id === id ? { ...d, certs: d.certs.filter((_, i) => i !== idx) } : d));

  const detailVehicle = detailVehicleId ? vehicles.find((v) => v.id === detailVehicleId) : null;
  const detailDriver = detailDriverId ? drivers.find((d) => d.id === detailDriverId) : null;

  // Butonul principal oglindește tabul activ — la fel ca add-vehicle.
  const onDrivers = isB2B && b2bTab === 'drivers';
  const primaryAdd = () => (onDrivers ? setAddDriverOpen(true) : setAddVehicleOpen(true));

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {fonts}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between h-14 items-center">
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <span className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: '#003399' }}>
                <Shield className="text-white" size={15} />
              </span>
              <span className="font-extrabold text-lg tracking-tight hidden sm:block" style={{ fontFamily: "'Archivo', sans-serif" }}>AutoDocs</span>
              <span className="text-slate-300 hidden sm:block">/</span>
              <ContextSwitcher spaces={spaces} current={context} onSelect={setContext} />
            </div>
            <div className="flex items-center gap-1 sm:gap-3">
              <button className="relative p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-700" aria-label={`Notificări: ${problemCount} alerte`}>
                <Bell size={17} />
                {problemCount > 0 && <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />}
              </button>
              <span className="text-xs text-slate-400 hidden md:block">{user.email}</span>
              <Button variant="ghost" size="sm" onClick={() => { setUser(null); setContext('personal'); setB2bTab('vehicles'); }} aria-label="Ieși din cont"><LogOut size={16} /></Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-7">
        <div className="flex flex-wrap justify-between items-end gap-3 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight" style={{ fontFamily: "'Archivo', sans-serif" }}>
              {isB2B ? activeSpace.name : 'Mașinile mele'}
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {problemCount === 0
                ? 'Toate documentele sunt în regulă.'
                : `${problemCount} ${problemCount === 1 ? 'vehicul cere' : 'vehicule cer'} atenție. Restul e în regulă.`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setAlertModalOpen(true)}>
              <Settings size={16} className="mr-1.5" /> Tipuri alerte
            </Button>
            <Button variant="blue" onClick={primaryAdd}>
              <Plus size={16} className="mr-1.5" /> {onDrivers ? 'Adaugă șofer' : 'Adaugă vehicul'}
            </Button>
          </div>
        </div>

        {isB2B
          ? <B2BDashboard tab={b2bTab} setTab={setB2bTab} vehicles={vehiclesB2B} drivers={drivers} onRca={setRcaVehicle} onCasco={setCascoVehicle} onOpenVehicle={(v) => setDetailVehicleId(v.id)} onOpenDriver={(d) => setDetailDriverId(d.id)} />
          : <B2CDashboard vehicles={vehiclesB2C} onRca={setRcaVehicle} onCasco={setCascoVehicle} onAdd={() => setAddVehicleOpen(true)} onOpen={(v) => setDetailVehicleId(v.id)} />}
      </main>

      <AddVehicleModal isOpen={addVehicleOpen} onClose={() => setAddVehicleOpen(false)} onSubmit={addVehicle} />
      <AddDriverModal isOpen={addDriverOpen} onClose={() => setAddDriverOpen(false)} onSubmit={addDriver} />
      {detailVehicle && (
        <VehicleDetail
          vehicle={detailVehicle} isB2B={isB2B} alertTypes={alertTypes}
          onRca={setRcaVehicle} onCasco={setCascoVehicle}
          onAddDoc={addVehicleDoc} onDeleteDoc={deleteVehicleDoc} onDelete={deleteVehicle}
          onClose={() => setDetailVehicleId(null)}
        />
      )}
      {detailDriver && (
        <DriverDetail
          driver={detailDriver}
          onUpdate={updateDriver} onAddCert={addDriverCert} onDeleteCert={deleteDriverCert} onDelete={deleteDriver}
          onClose={() => setDetailDriverId(null)}
        />
      )}
      {alertModalOpen && <AlertTypesModal selected={alertTypes} onSave={setAlertTypes} onClose={() => setAlertModalOpen(false)} />}
      {rcaVehicle && <RcaModal vehicle={rcaVehicle} onClose={() => setRcaVehicle(null)} />}
      {cascoVehicle && <CascoModal vehicle={cascoVehicle} onClose={() => setCascoVehicle(null)} />}
    </div>
  );
}
