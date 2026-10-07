"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";
import {
  adminAddVehicleDocSchema,
  adminUpdateVehicleDocSchema,
} from "@/lib/validation/misc-actions";

/**
 * Verifică sesiunea + rolul de admin (D-032) înainte de orice mutație pe
 * vehicle_docs. RLS (policy-urile `*_admin`, prin `is_app_admin()`) ar
 * bloca oricum un cont neautorizat, dar verificarea explicită dă un mesaj
 * de eroare clar în loc de un eșec tăcut la insert/update.
 */
async function requireAdmin() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!isAdmin(auth.user)) {
    throw new Error("Acces interzis.");
  }
  return supabase;
}

export async function adminAddVehicleDocAction(vehicleId: string, type: string, expiresAt: string) {
  const input = adminAddVehicleDocSchema.parse({ vehicleId, type, expiresAt });
  const supabase = await requireAdmin();
  const { data, error } = await supabase
    .from("vehicle_docs")
    .insert({ vehicle_id: input.vehicleId, type: input.type, expires_at: input.expiresAt })
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
  const input = adminUpdateVehicleDocSchema.parse({ docId, vehicleId, patch });
  const supabase = await requireAdmin();
  const { data, error } = await supabase
    .from("vehicle_docs")
    .update({ type: input.patch.type, expires_at: input.patch.expiresAt })
    .eq("id", docId)
    .select()
    .single();

  if (error || !data) throw new Error("Nu am putut actualiza documentul.");

  revalidatePath(`/admin/vehicles/${vehicleId}`);
  return data;
}
