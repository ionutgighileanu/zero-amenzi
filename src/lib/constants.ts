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
