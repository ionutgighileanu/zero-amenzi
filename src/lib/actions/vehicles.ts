"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { plausibleDocDates } from "@/lib/vehicles";

export type VehicleScope =
  | { ownerId: string; orgId?: undefined }
  | { ownerId?: undefined; orgId: string };
type Scope = VehicleScope;

function scopePath(scope: Scope, orgIdForPath?: string) {
  return scope.ownerId ? "/app/garage" : `/app/fleet/${orgIdForPath ?? scope.orgId}`;
}

export async function addVehicleAction(scope: Scope, plate: string, vin: string) {
  const supabase = await createClient();

  const { data: vehicle, error } = await supabase
    .from("vehicles")
    .insert({
      plate: plate.trim().toUpperCase(),
      vin: vin.trim().toUpperCase(),
      owner_id: scope.ownerId ?? null,
      org_id: scope.orgId ?? null,
    })
    .select()
    .single();

  if (error || !vehicle) throw new Error("Nu am putut adăuga vehiculul.");

  // Simulăm verificarea automată în bazele oficiale: ITP/RCA/Rovinietă
  // primesc date plauzibile — vezi CLAUDE.md, „nu introduci nicio dată manual".
  const docs = Object.entries(plausibleDocDates()).map(([type, expiresAt]) => ({
    vehicle_id: vehicle.id,
    type,
    expires_at: expiresAt,
  }));
  const { data: docRows, error: docsError } = await supabase
    .from("vehicle_docs")
    .insert(docs)
    .select();

  if (docsError) throw new Error("Vehiculul a fost creat, dar documentele nu s-au putut genera.");

  revalidatePath(scopePath(scope));
  return { vehicle, docs: docRows ?? [] };
}

export async function softDeleteVehicleAction(id: string, scope: Scope) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("vehicles")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error("Nu am putut șterge vehiculul.");
  revalidatePath(scopePath(scope));
}

export async function undoDeleteVehicleAction(id: string, scope: Scope) {
  const supabase = await createClient();
  const { error } = await supabase.from("vehicles").update({ deleted_at: null }).eq("id", id);
  if (error) throw new Error("Nu am putut anula ștergerea.");
  revalidatePath(scopePath(scope));
}

export async function addVehicleDocAction(
  vehicleId: string,
  type: string,
  expiresAt: string,
  scope: Scope
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vehicle_docs")
    .insert({ vehicle_id: vehicleId, type, expires_at: expiresAt })
    .select()
    .single();
  if (error || !data) throw new Error("Nu am putut adăuga documentul.");
  revalidatePath(scopePath(scope));
  return data;
}

export async function deleteVehicleDocAction(docId: string, scope: Scope) {
  const supabase = await createClient();
  const { error } = await supabase.from("vehicle_docs").delete().eq("id", docId);
  if (error) throw new Error("Nu am putut șterge documentul.");
  revalidatePath(scopePath(scope));
}
