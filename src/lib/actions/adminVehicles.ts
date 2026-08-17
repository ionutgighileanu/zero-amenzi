"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { ADMIN_EMAIL } from "@/lib/constants";

/**
 * Verifică sesiunea + emailul de admin înainte de orice mutație pe
 * vehicle_docs. RLS (vezi 20260817120000_admin_vehicle_docs_rls.sql) ar
 * bloca oricum un cont neautorizat, dar verificarea explicită dă un mesaj
 * de eroare clar în loc de un eșec tăcut la insert/update.
 */
async function requireAdmin() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (auth.user?.email !== ADMIN_EMAIL) {
    throw new Error("Acces interzis.");
  }
  return supabase;
}

export async function adminAddVehicleDocAction(vehicleId: string, type: string, expiresAt: string) {
  const supabase = await requireAdmin();
  const { data, error } = await supabase
    .from("vehicle_docs")
    .insert({ vehicle_id: vehicleId, type, expires_at: expiresAt })
    .select()
    .single();

  if (error || !data) throw new Error("Nu am putut adăuga documentul.");

  revalidatePath(`/admin/vehicles/${vehicleId}`);
  return data;
}

export async function adminUpdateVehicleDocAction(
  docId: string,
  vehicleId: string,
  patch: { type: string; expiresAt: string }
) {
  const supabase = await requireAdmin();
  const { data, error } = await supabase
    .from("vehicle_docs")
    .update({ type: patch.type, expires_at: patch.expiresAt })
    .eq("id", docId)
    .select()
    .single();

  if (error || !data) throw new Error("Nu am putut actualiza documentul.");

  revalidatePath(`/admin/vehicles/${vehicleId}`);
  return data;
}
