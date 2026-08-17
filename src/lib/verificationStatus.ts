import type { Database } from "@/lib/supabase/database.types";

type VerificationRow = Database["public"]["Tables"]["verification_requests"]["Row"];
type ResultValue = VerificationRow["result_itp"];

export type VerificationDocResults = {
  itp: ResultValue;
  rca: ResultValue;
  rovinieta: ResultValue;
  itpExpires: string | null;
  rcaExpires: string | null;
  rovinietaExpires: string | null;
};

/** Forma răspunsului de la /api/verificare/status/[id]. Statusul e în
 * română fiindcă e contractul public al endpoint-ului, nu o valoare din DB
 * (coloana rămâne 'pending' / 'completed'). */
export type VerificationStatusResponse =
  | { status: "in_procesare"; plate: string; createdAt: string }
  | {
      status: "completa";
      plate: string;
      createdAt: string;
      completedAt: string | null;
      results: VerificationDocResults;
    };

export function toStatusResponse(request: VerificationRow): VerificationStatusResponse {
  if (request.status !== "completed") {
    return {
      status: "in_procesare",
      plate: request.plate_number,
      createdAt: request.created_at,
    };
  }

  return {
    status: "completa",
    plate: request.plate_number,
    createdAt: request.created_at,
    completedAt: request.completed_at,
    results: {
      itp: request.result_itp,
      rca: request.result_rca,
      rovinieta: request.result_rovinieta,
      itpExpires: request.result_itp_expires,
      rcaExpires: request.result_rca_expires,
      rovinietaExpires: request.result_rovinieta_expires,
    },
  };
}
