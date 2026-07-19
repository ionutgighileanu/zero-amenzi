export const BRAND_BLUE = "#003399";

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

export type RcaOffer = { insurer: string; price: number; best: boolean };

export const RCA_OFFERS: RcaOffer[] = [
  { insurer: "Grawe România", price: 668, best: true },
  { insurer: "Allianz Țiriac", price: 689, best: false },
  { insurer: "Generali", price: 701, best: false },
  { insurer: "Groupama", price: 723, best: false },
  { insurer: "Omniasig VIG", price: 745, best: false },
];
