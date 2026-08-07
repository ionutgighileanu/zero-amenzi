"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function fleetPath(orgId: string) {
  return `/app/fleet/${orgId}`;
}

export async function addDriverAction(orgId: string, name: string, phone: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("drivers")
    .insert({ org_id: orgId, name: name.trim(), phone: phone.trim() })
    .select()
    .single();
  if (error || !data) throw new Error("Nu am putut adăuga șoferul.");
  revalidatePath(fleetPath(orgId));
  return data;
}

export async function softDeleteDriverAction(id: string, orgId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("drivers")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error("Nu am putut șterge șoferul.");
  revalidatePath(fleetPath(orgId));
}

export async function undoDeleteDriverAction(id: string, orgId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("drivers").update({ deleted_at: null }).eq("id", id);
  if (error) throw new Error("Nu am putut anula ștergerea.");
  revalidatePath(fleetPath(orgId));
}

export async function updateDriverAction(
  id: string,
  patch: { name: string; phone: string },
  orgId: string
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("drivers")
    .update({ name: patch.name, phone: patch.phone })
    .eq("id", id);
  if (error) throw new Error("Nu am putut salva modificările.");
  revalidatePath(fleetPath(orgId));
}

export async function addDriverCertAction(
  driverId: string,
  type: string,
  expiresAt: string,
  orgId: string
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("driver_certs")
    .insert({ driver_id: driverId, type, expires_at: expiresAt })
    .select()
    .single();
  if (error || !data) throw new Error("Nu am putut adăuga documentul.");
  revalidatePath(fleetPath(orgId));
  return data;
}

export async function deleteDriverCertAction(certId: string, orgId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("driver_certs").delete().eq("id", certId);
  if (error) throw new Error("Nu am putut șterge documentul.");
  revalidatePath(fleetPath(orgId));
}
