import { createAdminClient } from "@/lib/supabase/admin";
import { describeResult } from "@/lib/verification";
import type { Database } from "@/lib/supabase/database.types";

type VerificationRow = Database["public"]["Tables"]["verification_requests"]["Row"];

/** Rezumatul celor trei documente, pe un singur rând — același text apare
 * în clopoțel și în corpul notificării. */
export function buildVerificationNotificationBody(request: VerificationRow): string {
  return [
    `ITP · ${describeResult(request.result_itp, request.result_itp_expires).text}`,
    `RCA · ${describeResult(request.result_rca, request.result_rca_expires).text}`,
    `Rovinietă · ${describeResult(request.result_rovinieta, request.result_rovinieta_expires).text}`,
  ].join(" · ");
}

/**
 * Creează notificarea in-app pentru cererea finalizată. Scrisă cu service_role:
 * adminul inserează un rând pentru ALT user, ceea ce nicio policy bazată pe
 * auth.uid() n-ar permite (vezi migrarea — tabela n-are policy de INSERT).
 *
 * Best-effort, ca și email-ul: dacă inserarea eșuează, cererea rămâne
 * completată și vizibilă pe pagina de status. Indexul unic pe
 * verification_request_id face a doua încercare inofensivă (dublu-click pe
 * „Completează", retry) — tratăm coliziunea drept succes, nu eroare.
 */
export async function createVerificationNotification(
  request: VerificationRow,
  href = `/verificare/status/${request.id}`
): Promise<boolean> {
  if (!request.user_id) return false;

  const supabase = createAdminClient();
  const { error } = await supabase.from("notifications").insert({
    user_id: request.user_id,
    type: "verification_completed",
    verification_request_id: request.id,
    title: `Verificare finalizată — ${request.plate_number}`,
    body: buildVerificationNotificationBody(request),
    href,
  });

  if (error) {
    // 23505 = unique_violation: notificarea există deja pentru cererea asta.
    if (error.code === "23505") return true;
    console.error("Nu am putut crea notificarea in-app:", error);
    return false;
  }
  return true;
}
