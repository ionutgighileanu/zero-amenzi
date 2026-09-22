import { daysUntil, formatDate, getStatus } from "@/lib/status";
import type { VerificationResultValue } from "@/lib/constants";

export type ResultTone = "valid" | "warning" | "expired" | "none";

export type ResultLine = { tone: ResultTone; text: string };

/**
 * Traduce verdictul adminului (tri-state + dată opțională) în ce arată pe
 * ecran — vezi PRD §5.1 pentru formatul exact („ITP · Valid până la…",
 * „RCA · Expiră în X zile…", „Rovinietă · EXPIRATĂ"). Dacă adminul a dat
 * și o dată, semaforul urmează aceeași logică (getStatus) ca restul
 * aplicației — un document „valid" cu expirare în 10 zile arată amber,
 * nu verde, exact ca pe VehicleCard.
 */
export function describeResult(
  result: VerificationResultValue | null,
  expiresAt: string | null
): ResultLine {
  if (!result || result === "nu_gasit") {
    return { tone: "none", text: "Nu am găsit informații" };
  }

  if (expiresAt) {
    const status = getStatus(expiresAt);
    const d = daysUntil(expiresAt) ?? 0;
    if (status === "expired") {
      return d === 0
        ? { tone: "expired", text: `Expiră azi · ${formatDate(expiresAt)}` }
        : { tone: "expired", text: "EXPIRATĂ" };
    }
    if (status === "warning") {
      return {
        tone: "warning",
        text: `Expiră în ${d} ${d === 1 ? "zi" : "zile"} · ${formatDate(expiresAt)}`,
      };
    }
    return { tone: "valid", text: `Valid până la ${formatDate(expiresAt)}` };
  }

  // Admin a dat verdictul fără dată exactă de expirare.
  return result === "valid" ? { tone: "valid", text: "Valid" } : { tone: "expired", text: "EXPIRATĂ" };
}
