"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  addDriverCertSchema,
  addDriverSchema,
  deleteDriverCertSchema,
  driverByIdSchema,
  updateDriverSchema,
} from "@/lib/validation/drivers";

/** Șoferii există doar la flote, deci ruta e mereu /app/fleet/[spaceId]. */
function fleetPath(spaceId: string) {
  return `/app/fleet/${spaceId}`;
}

export async function addDriverAction(spaceId: string, name: string, phone: string) {
  const input = addDriverSchema.parse({ spaceId, name, phone });
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("drivers")
    .insert({ space_id: input.spaceId, name: input.name, phone: input.phone })
    .select()
    .single();
  if (error || !data) throw new Error("Nu am putut adăuga șoferul.");
  revalidatePath(fleetPath(spaceId));
  return data;
}

export async function softDeleteDriverAction(id: string, spaceId: string) {
  driverByIdSchema.parse({ id, spaceId });
  const supabase = await createClient();
  const { error } = await supabase
    .from("drivers")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error("Nu am putut șterge șoferul.");
  revalidatePath(fleetPath(spaceId));
}

export async function undoDeleteDriverAction(id: string, spaceId: string) {
  driverByIdSchema.parse({ id, spaceId });
  const supabase = await createClient();
  const { error } = await supabase.from("drivers").update({ deleted_at: null }).eq("id", id);
  if (error) throw new Error("Nu am putut anula ștergerea.");
  revalidatePath(fleetPath(spaceId));
}

export async function updateDriverAction(
  id: string,
  patch: { name: string; phone: string },
  spaceId: string
) {
  const input = updateDriverSchema.parse({ id, patch, spaceId });
  const supabase = await createClient();
  const { error } = await supabase
    .from("drivers")
    .update({ name: input.patch.name, phone: input.patch.phone })
    .eq("id", id);
  if (error) throw new Error("Nu am putut salva modificările.");
  revalidatePath(fleetPath(spaceId));
}

export async function addDriverCertAction(
  driverId: string,
  type: string,
  expiresAt: string,
  spaceId: string
) {
  const input = addDriverCertSchema.parse({ driverId, type, expiresAt, spaceId });
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("driver_certs")
    .insert({ driver_id: input.driverId, type: input.type, expires_at: input.expiresAt })
    .select()
    .single();
  if (error || !data) throw new Error("Nu am putut adăuga documentul.");
  revalidatePath(fleetPath(spaceId));
  return data;
}

export async function deleteDriverCertAction(certId: string, spaceId: string) {
  deleteDriverCertSchema.parse({ certId, spaceId });
  const supabase = await createClient();
  const { error } = await supabase.from("driver_certs").delete().eq("id", certId);
  if (error) throw new Error("Nu am putut șterge documentul.");
  revalidatePath(fleetPath(spaceId));
}
