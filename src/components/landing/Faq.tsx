"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const FAQ_DATA: [string, string][] = [
  [
    "Ce este AutoDocs?",
    "AutoDocs verifică automat dacă ITP-ul, RCA-ul și rovinieta mașinii tale sunt valabile și te notifică înainte de expirare, ca să nu mai iei amenzi. Funcționează și pentru persoane fizice, și pentru flote de companie.",
  ],
  [
    "Cât costă?",
    "Contul gratuit include 1 vehicul cu verificare unică și notificări pe email. Contul PRO (15 lei/an per vehicul) adaugă monitorizare recurentă, alerte SMS și documente suplimentare (extinctor, CASCO, service etc.). PRO e gratuit dacă îți faci RCA prin noi.",
  ],
  [
    "Cum funcționează notificările?",
    "Primești alerte cu 30 de zile, 15 zile, 2 zile și în ziua expirării — pe email (cont gratuit) sau email + SMS (cont PRO). Pe telefonul mobil, aplicația PWA trimite și notificări push gratuit.",
  ],
  [
    "Ce riscuri am cu actele expirate?",
    "ITP expirat: amendă 1.822–4.050 lei + reținerea plăcuțelor. RCA expirat: 1.000–2.000 lei + răspundere personală nelimitată. Rovinietă lipsă: 500–1.000 lei (amendă automată prin camerele CNAIR). O singură notificare te poate scuti de mii de lei.",
  ],
  [
    "Pot monitoriza mai multe mașini?",
    "Da. Cu planul PRO adaugi oricâte vehicule — ideal pentru familii sau firme. Fiecare vehicul are propriile alerte.",
  ],
  [
    "Pot cumpăra RCA prin AutoDocs?",
    "Da. Compari oferte de la mai mulți asigurători, alegi cea mai ieftină și închei polița online. Bonus: primești PRO gratuit 1 an la fiecare RCA cumpărat prin noi.",
  ],
  [
    "Stocați documente personale?",
    "Nu. Nu stocăm copii ale buletinului, permisului sau altor acte de identitate. Salvăm doar datele de expirare necesare pentru alerte — nimic mai mult.",
  ],
  [
    "Funcționează și pe telefon?",
    "Da. AutoDocs este un PWA (Progressive Web App) — îl instalezi direct din browser pe ecranul principal, fără App Store sau Google Play. Funcționează offline și primești notificări push ca o aplicație nativă.",
  ],
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-slate-200">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex justify-between items-center gap-4 py-4 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 rounded"
      >
        <span className="text-sm sm:text-base font-semibold text-slate-900">{q}</span>
        <ChevronDown
          size={18}
          className={`shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && <p className="text-sm text-slate-600 pb-4 leading-relaxed">{a}</p>}
    </div>
  );
}

export function Faq() {
  return (
    <div className="mt-8">
      {FAQ_DATA.map(([q, a]) => (
        <FaqItem key={q} q={q} a={a} />
      ))}
    </div>
  );
}
