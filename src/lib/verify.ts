export type VerificationResult = {
  plate: string;
  vehicle: string;
  itp: { status: "valid" | "warning" | "expired"; label: string };
  rca: { status: "valid" | "warning" | "expired"; label: string };
  rovinieta: { status: "valid" | "warning" | "expired"; label: string };
};

// Mock only. Replace with a Supabase call (or the real ITP/RCA/rovinietă
// lookup API) once the backend exists — same signature, same result shape.
export async function verifyPlate(plate: string): Promise<VerificationResult> {
  const delay = 1000 + Math.random() * 1000;
  await new Promise((resolve) => setTimeout(resolve, delay));

  const normalized = plate.trim().toUpperCase();

  if (normalized.includes("ERR")) {
    throw new Error("SERVICE_UNAVAILABLE");
  }

  if (normalized.includes("999") || normalized.length < 5) {
    throw new Error("NOT_FOUND");
  }

  return {
    plate: normalized,
    vehicle: "Volkswagen Golf · 2019",
    itp: { status: "valid", label: "247 zile" },
    rca: { status: "expired", label: "-3 zile" },
    rovinieta: { status: "warning", label: "12 zile" },
  };
}
