"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { notificationIdSchema } from "@/lib/validation/misc-actions";

/**
 * Marchează o notificare din tabela `notifications` ca citită. RLS permite
 * UPDATE doar pe rândurile propriului cont, deci nu e nevoie de o verificare
 * suplimentară aici — un id străin pur și simplu nu atinge niciun rând.
 */
export async function markInAppNotificationReadAction(id: string) {
  notificationIdSchema.parse(id);
  const supabase = await createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error("Nu am putut marca notificarea ca citită.");
  revalidatePath("/app", "layout");
}
