"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { saveAlertTypesSchema } from "@/lib/validation/misc-actions";
import { fetchSpace, spacePath } from "@/lib/spaces";

/** Rescrie toată lista de tipuri de alerte pentru un garaj personal sau o
 * flotă (max. 15, vezi AlertTypesModal) — șterge tot și reinserează, simplu
 * de raționat pentru o listă mică care se salvează dintr-o singură dată. */
export async function saveAlertTypesAction(spaceId: string, names: string[]) {
  // Plafonul pe lungimea listei exista doar în AlertTypesModal — un apel
  // direct la acțiune putea insera oricâte rânduri (F-07).
  const input = saveAlertTypesSchema.parse({ spaceId, names });
  const supabase = await createClient();

  const { error: deleteError } = await supabase
    .from("alert_types")
    .delete()
    .eq("space_id", input.spaceId);
  if (deleteError) throw new Error("Nu am putut actualiza tipurile de alerte.");

  if (input.names.length > 0) {
    const rows = input.names.map((name) => ({ name, space_id: input.spaceId }));
    const { error: insertError } = await supabase.from("alert_types").insert(rows);
    if (insertError) throw new Error("Nu am putut salva tipurile de alerte.");
  }

  const space = await fetchSpace(supabase, input.spaceId);
  if (space) revalidatePath(spacePath(space));
}
