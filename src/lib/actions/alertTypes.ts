"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { VehicleScope } from "@/lib/actions/vehicles";
import { saveAlertTypesSchema } from "@/lib/validation/misc-actions";

/** Rescrie toată lista de tipuri de alerte pentru un garaj personal sau o
 * flotă (max. 15, vezi AlertTypesModal) — șterge tot și reinserează, simplu
 * de raționat pentru o listă mică care se salvează dintr-o singură dată. */
export async function saveAlertTypesAction(scope: VehicleScope, names: string[]) {
  // Plafonul pe lungimea listei exista doar în AlertTypesModal — un apel
  // direct la acțiune putea insera oricâte rânduri (F-07).
  const input = saveAlertTypesSchema.parse({ scope, names });
  const supabase = await createClient();

  const filter = scope.ownerId
    ? { column: "owner_id" as const, value: scope.ownerId }
    : { column: "org_id" as const, value: scope.orgId! };

  const { error: deleteError } = await supabase
    .from("alert_types")
    .delete()
    .eq(filter.column, filter.value);
  if (deleteError) throw new Error("Nu am putut actualiza tipurile de alerte.");

  if (input.names.length > 0) {
    const rows = input.names.map((name) => ({
      name,
      owner_id: scope.ownerId ?? null,
      org_id: scope.orgId ?? null,
    }));
    const { error: insertError } = await supabase.from("alert_types").insert(rows);
    if (insertError) throw new Error("Nu am putut salva tipurile de alerte.");
  }

  revalidatePath(scope.ownerId ? "/app/garage" : `/app/fleet/${scope.orgId}`);
}
