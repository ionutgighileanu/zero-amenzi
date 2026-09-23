/**
 * Întrebările frecvente de pe landing.
 *
 * Într-un fișier propriu pentru că sunt folosite în două locuri: lista din
 * pagină (componentă de client) și datele structurate FAQPage trimise lui
 * Google (randate pe server). O singură sursă, ca răspunsul din rezultatele
 * căutării să nu ajungă să difere de cel de pe site.
 */
export const FAQ_ITEMS: { question: string; answer: string }[] = [
  {
    question: "Ce este AutoDocs?",
    answer:
      "AutoDocs verifică automat dacă ITP-ul, RCA-ul și rovinieta mașinii tale sunt valabile și te notifică înainte de expirare, ca să nu mai iei amenzi. Funcționează și pentru persoane fizice, și pentru flote de companie.",
  },
  {
    question: "Cât costă?",
    answer:
      "Primul vehicul e gratuit un an, cu acces complet: verificare ITP, RCA și rovinietă. Pentru fiecare vehicul în plus, sau după primul an, Premium costă 12 lei/an per vehicul — același preț pentru persoane fizice și pentru firme.",
  },
  {
    question: "Cum funcționează notificările?",
    answer:
      "Primești alerte cu 30 de zile, 15 zile, 2 zile și în ziua expirării, pe email. Pe telefonul mobil, aplicația PWA trimite și notificări push, gratuit.",
  },
  {
    question: "Ce riscuri am cu actele expirate?",
    answer:
      "ITP expirat: amendă 1.822–4.050 lei + reținerea plăcuțelor. RCA expirat: 1.000–2.000 lei + răspundere personală nelimitată. Rovinietă lipsă: 500–1.000 lei (amendă automată prin camerele CNAIR). O singură notificare te poate scuti de mii de lei.",
  },
  {
    question: "Pot monitoriza mai multe mașini?",
    answer:
      "Da, adaugi oricâte vehicule — ideal pentru familii sau firme. Primul e gratuit un an; pentru restul plătești 12 lei/an per vehicul. Fiecare vehicul are propriile alerte.",
  },
  {
    question: "Pot cumpăra RCA prin AutoDocs?",
    answer:
      "Nu încă. Îți arătăm oferte orientative de la mai mulți asigurători, dar cumpărarea online și reducerea de preț legată de ea urmează să fie activate.",
  },
  {
    question: "Stocați documente personale?",
    answer:
      "Nu. Nu stocăm copii ale buletinului, permisului sau altor acte de identitate. Salvăm doar datele de expirare necesare pentru alerte — nimic mai mult.",
  },
  {
    question: "Funcționează și pe telefon?",
    answer:
      "Da. AutoDocs este un PWA (Progressive Web App) — îl instalezi direct din browser pe ecranul principal, fără App Store sau Google Play. Funcționează offline și primești notificări push ca o aplicație nativă.",
  },
];
