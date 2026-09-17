import { daysUntil } from "@/lib/status";
import { vehicleAccess, type SubscribableSpace, type VehicleAccess } from "@/lib/subscription";
import type { Database } from "@/lib/supabase/database.types";

export type VehicleDoc = { id: string; type: string; expires: string };

export type Vehicle = {
  id: string;
  plate: string;
  vin: string;
  model?: string | null;
  /** Data până la care vehiculul e plătit individual. null = neplătit
   * (acoperit de trial, sau blocat). Înlocuiește vechiul isPremium. */
  paidUntil?: string | null;
  /** Starea de acces, calculată din abonamentul spațiului + paidUntil.
   * „locked" înseamnă că datele RCA/ITP/Rovinietă nu se afișează. */
  access?: VehicleAccess;
  truck?: boolean;
  itp: string | null;
  rca: string | null;
  rovinieta: string | null;
  tahograf?: string | null;
  docs?: VehicleDoc[];
  deleted_at: string | null;
};

export type DriverCert = { id: string; type: string; expires: string };

export type Driver = {
  id: string;
  name: string;
  phone: string;
  certs: DriverCert[];
  deleted_at: string | null;
};

/** Cele patru documente obligatorii, mapate direct pe câmpuri fixe ale
 * Vehicle. Orice alt `type` din vehicle_docs devine o alertă suplimentară. */
export const CORE_DOC_TYPES = {
  itp: "ITP",
  rca: "RCA",
  rovinieta: "Rovinietă",
  tahograf: "Tahograf",
} as const;

type VehicleRow = Database["public"]["Tables"]["vehicles"]["Row"];
type VehicleDocRow = Database["public"]["Tables"]["vehicle_docs"]["Row"];
type DriverRow = Database["public"]["Tables"]["drivers"]["Row"];
type DriverCertRow = Database["public"]["Tables"]["driver_certs"]["Row"];

export function mapVehicleRow(
  row: VehicleRow,
  docs: VehicleDocRow[],
  space?: SubscribableSpace
): Vehicle {
  const findDoc = (type: string) => docs.find((d) => d.type === type)?.expires_at ?? null;
  const coreTypes = Object.values(CORE_DOC_TYPES);
  const extra = docs
    .filter((d) => !coreTypes.includes(d.type as (typeof coreTypes)[number]))
    .map((d) => ({ id: d.id, type: d.type, expires: d.expires_at }));

  return {
    id: row.id,
    plate: row.plate,
    vin: row.vin,
    model: row.model,
    paidUntil: row.paid_until,
    // Fără spațiu (apeluri vechi, sau contexte unde abonamentul nu contează)
    // lăsăm access nedefinit, nu „locked" — altfel am ascunde date din
    // greșeală acolo unde apelantul n-a apucat să treacă spațiul.
    access: space ? vehicleAccess(space, row.paid_until) : undefined,
    truck: row.is_truck,
    itp: findDoc(CORE_DOC_TYPES.itp),
    rca: findDoc(CORE_DOC_TYPES.rca),
    rovinieta: findDoc(CORE_DOC_TYPES.rovinieta),
    tahograf: findDoc(CORE_DOC_TYPES.tahograf),
    docs: extra,
    deleted_at: row.deleted_at,
  };
}

export function mapDriverRow(row: DriverRow, certs: DriverCertRow[]): Driver {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    deleted_at: row.deleted_at,
    certs: certs.map((c) => ({ id: c.id, type: c.type, expires: c.expires_at })),
  };
}

/** Datele plauzibile atribuite la crearea unui vehicul, simulând verificarea
 * automată în bazele oficiale (vezi CLAUDE.md — "Nu introduci nicio dată manual"). */
export function plausibleDocDates() {
  const inDays = (n: number) =>
    new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10);
  return {
    [CORE_DOC_TYPES.itp]: inDays(280),
    [CORE_DOC_TYPES.rca]: inDays(150),
    [CORE_DOC_TYPES.rovinieta]: inDays(210),
  };
}

/** Cel mai urgent document al unui vehicul — pentru sortarea „problems-first". */
export function minDays(v: Vehicle): number {
  const all = [v.rca, v.itp, v.rovinieta, v.tahograf]
    .filter(Boolean)
    .map((d) => daysUntil(d) ?? Infinity);
  return all.length ? Math.min(...all) : Infinity;
}

export function vehicleStatus(v: Vehicle): "valid" | "warning" | "expired" {
  const d = minDays(v);
  if (d < 0) return "expired";
  if (d <= 15) return "warning";
  return "valid";
}
