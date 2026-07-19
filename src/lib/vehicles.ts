import { daysUntil } from "@/lib/status";

export type VehicleDoc = {
  type: string;
  expires: string;
};

export type Vehicle = {
  id: string;
  plate: string;
  vin: string;
  model?: string;
  isPremium?: boolean;
  truck?: boolean;
  itp: string;
  rca: string;
  rovinieta: string;
  tahograf?: string | null;
  docs?: VehicleDoc[];
  deleted_at: string | null;
};

export type DriverCert = {
  type: string;
  expires: string;
};

export type Driver = {
  id: string;
  name: string;
  phone: string;
  certs: DriverCert[];
  deleted_at: string | null;
};

/** Cel mai urgent document al unui vehicul — pentru sortarea „problems-first". */
export function minDays(v: Vehicle): number {
  const all = [v.rca, v.itp, v.rovinieta, v.tahograf]
    .filter(Boolean)
    .map((d) => daysUntil(d) ?? Infinity);
  return Math.min(...all);
}

export function vehicleStatus(v: Vehicle): "valid" | "warning" | "expired" {
  const d = minDays(v);
  if (d < 0) return "expired";
  if (d <= 15) return "warning";
  return "valid";
}

/** Simulează verificarea în bazele oficiale la adăugare: date plauzibile, valide. */
export function createVehicle(plate: string, vin: string): Vehicle {
  const inDays = (n: number) =>
    new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10);
  return {
    id: "v" + Date.now(),
    plate,
    vin,
    isPremium: false,
    truck: false,
    itp: inDays(280),
    rca: inDays(150),
    rovinieta: inDays(210),
    tahograf: null,
    docs: [],
    deleted_at: null,
  };
}

export function createDriver(name: string, phone: string): Driver {
  return { id: "d" + Date.now(), name, phone, certs: [], deleted_at: null };
}

/* ---------- MOCK DATA — se înlocuiește cu query-uri Supabase ---------- */

export const MOCK_VEHICLES_B2C: Vehicle[] = [
  {
    id: "c1",
    plate: "B 100 ABC",
    vin: "WAUZZZ8T0BA000001",
    model: "Volkswagen Golf · 2019",
    isPremium: true,
    itp: "2026-10-15",
    rca: "2026-07-20",
    rovinieta: "2027-01-05",
    docs: [
      { type: "Extinctor", expires: "2026-08-05" },
      { type: "Trusă medicală", expires: "2027-05-01" },
    ],
    deleted_at: null,
  },
  {
    id: "c2",
    plate: "CJ 99 XYZ",
    vin: "WVWZZZ1K0BW000002",
    model: "Dacia Logan · 2021",
    isPremium: false,
    itp: "2027-02-10",
    rca: "2026-11-20",
    rovinieta: "2026-07-25",
    docs: [],
    deleted_at: null,
  },
  {
    id: "c3",
    plate: "IS 07 DAN",
    vin: "VF1RFB00X56000003",
    model: "Renault Clio · 2017",
    isPremium: false,
    itp: "2026-06-28",
    rca: "2026-09-14",
    rovinieta: "2026-12-01",
    docs: [{ type: "Revizie / ulei", expires: "2026-09-30" }],
    deleted_at: null,
  },
];

export const MOCK_VEHICLES_B2B: Vehicle[] = [
  { id: "f1", plate: "B 10 FLT", vin: "WAUZZZ11111111111", truck: false, itp: "2027-01-15", rca: "2026-07-18", rovinieta: "2026-12-05", tahograf: null, deleted_at: null },
  { id: "f2", plate: "B 11 FLT", vin: "WAUZZZ22222222222", truck: true, itp: "2026-04-10", rca: "2026-08-20", rovinieta: "2026-07-16", tahograf: "2026-09-02", docs: [{ type: "CASCO", expires: "2026-08-15" }, { type: "Revizie", expires: "2026-07-19" }], deleted_at: null },
  { id: "f3", plate: "B 12 FLT", vin: "WAUZZZ33333333333", truck: true, itp: "2026-11-15", rca: "2027-02-20", rovinieta: "2027-03-05", tahograf: "2026-07-11", deleted_at: null },
  { id: "f4", plate: "IF 05 CAR", vin: "WAUZZZ44444444444", truck: false, itp: "2026-08-01", rca: "2026-07-10", rovinieta: "2026-10-10", tahograf: null, deleted_at: null },
  { id: "f5", plate: "B 77 LOG", vin: "WDB9634031L000005", truck: true, itp: "2026-09-22", rca: "2026-10-30", rovinieta: "2026-08-19", tahograf: "2027-04-18", docs: [{ type: "Leasing", expires: "2027-01-10" }, { type: "Service", expires: "2026-09-01" }], deleted_at: null },
  { id: "f6", plate: "GR 21 TRK", vin: "XLRTE47MS0E000006", truck: true, itp: "2027-03-08", rca: "2026-07-27", rovinieta: "2026-11-11", tahograf: "2026-12-01", deleted_at: null },
  { id: "f7", plate: "B 09 VAN", vin: "WV1ZZZ7HZ8H000007", truck: false, itp: "2026-12-14", rca: "2026-12-02", rovinieta: "2027-01-22", tahograf: null, deleted_at: null },
];

export const MOCK_DRIVERS: Driver[] = [
  { id: "d1", name: "Ion Popescu", phone: "0722 123 456", certs: [{ type: "Atestat ADR", expires: "2026-07-22" }, { type: "Fișă medicală", expires: "2027-01-15" }], deleted_at: null },
  { id: "d2", name: "Maria Ionescu", phone: "0733 987 654", certs: [{ type: "Aviz psihologic", expires: "2026-05-10" }], deleted_at: null },
  { id: "d3", name: "Andrei Vlad", phone: "0745 220 118", certs: [{ type: "Atestat marfă", expires: "2026-10-30" }, { type: "Aviz psihologic", expires: "2026-07-24" }], deleted_at: null },
];

export const MOCK_ORG = { id: "translog", name: "TransLog SRL" };
