export const BRAND_BLUE = "#003399";

/** Cookie temporar: intenția de a crea o firmă la signup, folosit dacă
 * Supabase cere confirmare pe email înainte de a avea o sesiune activă. */
export const PENDING_ORG_COOKIE = "ad_pending_org";

export const PRESET_ALERTS = [
  "Stingător",
  "Trusă medicală",
  "Service",
  "CASCO",
  "Leasing",
  "Revizie",
  "Impozit auto",
  "Verificare stingător",
];

export const DEFAULT_ALERT_TYPES = [
  "Stingător",
  "Trusă medicală",
  "Service",
  "CASCO",
  "Leasing",
  "Revizie",
];

export const MAX_ALERTS = 15;

/** Părțile unei plăcuțe RO, pe forma compactă (fără spații/cratime):
 * „B" + „12" + „ABC" sau „CJ" + „34" + „DEF". Folosit de normalizePlate()
 * (src/lib/plate.ts) ca să reconstruiască forma canonică. Deliberat puțin
 * permisiv: nu respinge combinații de litere rezervate, fiindcă scopul e
 * igiena inputului, nu validarea oficială. Plăcuțele temporare și cele
 * speciale NU trec. */
export const RO_PLATE_PARTS = /^([A-Z]{1,2})(\d{2,3})([A-Z]{3})$/;

/** Forma canonică, cu spații simple — singura acceptată la scriere în DB.
 * Orice input trece întâi prin normalizePlate(), deci regexul ăsta validează
 * ieșirea normalizării, nu inputul brut. */
export const RO_PLATE_REGEX = /^[A-Z]{1,2} \d{2,3} [A-Z]{3}$/;

/** Plafon pe inputul BRUT de plăcuță, înainte de normalizare — mărginește
 * munca pe un input ostil. Generos față de cele 10 caractere ale formei
 * canonice, ca să tolereze spațiere ciudată („B   12   ABC"). */
export const PLATE_INPUT_MAX_LENGTH = 32;

/** Plafon de lungime pe adresa de email primită de la vizitatori anonimi. */
export const EMAIL_MAX_LENGTH = 254;

/**
 * Plafoane de lungime pe câmpurile text scrise de utilizatori autentificați.
 *
 * Coloanele din Postgres sunt `text`, deci nemărginite. Server Actions sunt
 * endpoint-uri HTTP: oricine autentificat le poate apela direct, cu ce
 * argumente vrea, ocolind interfața — deci limitele din UI nu sunt o
 * protecție. Valorile sunt generoase față de datele reale, ca să nu respingă
 * un caz legitim; rolul lor e să mărginească abuzul, nu să valideze conținutul.
 */
export const FIELD_MAX_LENGTH = {
  /** VIN standard are 17 caractere; lăsăm loc pentru vehicule vechi/străine. */
  vin: 32,
  /** Nume șofer. */
  driverName: 120,
  /** Telefon, cu prefix internațional și separatoare. */
  phone: 32,
  /** Nume firmă. */
  orgName: 200,
  /** CUI românesc: „RO" + maximum 10 cifre. */
  cui: 20,
  /** Tip document sau atestat, inclusiv textul liber de la „Alt tip…". */
  docType: 60,
  /** Nume tip de alertă suplimentară. */
  alertTypeName: 60,
} as const;

/** Plafon pe numărul de notificări marcate ca citite dintr-un singur apel.
 * Clopoțelul trimite doar ce e pe ecran; un array nemărginit ar transforma
 * acțiunea într-un update de masă. */
export const MAX_NOTIFICATIONS_PER_BATCH = 200;

/** Push notifications și PWA install se oferă doar pe mobile (D-017) — pe
 * desktop push are conversie mică, iar fereastra PWA fără browser chrome pare
 * un bug. Folosit de PushOnboarding și InstallBanner, deci pragul se schimbă
 * dintr-un singur loc. */
export const MOBILE_VIEWPORT_QUERY = "(max-width: 768px)";

/** Praguri de alertă expirare document (zile rămase). Cronul verifică
 * exact aceste praguri o dată pe zi — vezi src/lib/cron/check-expiries.ts. */
export const NOTIFICATION_THRESHOLDS = [30, 15, 2, 0] as const;

/** Plafon zilnic de email-uri pe planul gratuit Resend (100/zi). */
export const EMAIL_DAILY_LIMIT = 100;

/** Singurul cont care poate completa cererile de verificare publică
 * (wizard-of-oz, D-010). Hardcodat pentru MVP — vezi migrarea
 * verification_requests, unde e oglindit în RLS. */
export const ADMIN_EMAIL = "ionut.gighileanu@gmail.com";

/** Tri-state pe care adminul îl atribuie fiecărui document verificat. */
export const VERIFICATION_RESULT_OPTIONS = [
  { value: "valid", label: "Valid" },
  { value: "expirat", label: "Expirat" },
  { value: "nu_gasit", label: "Nu am găsit" },
] as const;

export type VerificationResultValue = (typeof VERIFICATION_RESULT_OPTIONS)[number]["value"];

/** Cât de des întreabă pagina de status (/verificare/status/[id]) endpoint-ul
 * dacă cererea a fost completată. */
export const VERIFICATION_POLL_SECONDS = 60;

/** După atâtea ore de la trimitere, pagina de status renunță la verificarea
 * periodică — o cerere rămasă „pending" atât de mult n-o să se rezolve
 * singură, iar un tab uitat deschis nu trebuie să întrebe la nesfârșit. */
export const VERIFICATION_POLL_MAX_HOURS = 24;

/** TTL-ul cache-ului de pe /api/verificare/status/[id]. Mai scurt decât
 * intervalul de polling, ca un client să nu prindă niciodată același răspuns
 * cache-uit de două ori la rând. */
export const VERIFICATION_STATUS_CACHE_SECONDS = 30;

/** Linkuri către sursele oficiale de verificare, arătate în panoul admin
 * (/admin/vehicles/[id]) deasupra formularelor de adăugare/actualizare a
 * documentelor. Cheile trebuie să oglindească valorile din CORE_DOC_TYPES
 * (src/lib/vehicles.ts) — tipurile fără link (ex. Tahograf, tipuri custom)
 * pur și simplu nu apar în listă. */
export const ADMIN_DOC_HELPER_LINKS: Record<string, { label: string; url: string }> = {
  RCA: { label: "CEDAM", url: "https://www.cedam.ro/" },
  ITP: { label: "RAR", url: "https://www.rarom.ro/" },
  "Rovinietă": { label: "CNAIR", url: "https://www.roviniete.ro/" },
};

export type RcaOffer = { insurer: string; price: number; best: boolean };

export const RCA_OFFERS: RcaOffer[] = [
  { insurer: "Grawe România", price: 668, best: true },
  { insurer: "Allianz Țiriac", price: 689, best: false },
  { insurer: "Generali", price: 701, best: false },
  { insurer: "Groupama", price: 723, best: false },
  { insurer: "Omniasig VIG", price: 745, best: false },
];
