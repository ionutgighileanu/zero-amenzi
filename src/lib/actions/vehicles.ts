"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { plausibleDocDates } from "@/lib/vehicles";
import { fetchSpace, spacePath } from "@/lib/spaces";
import { canAddVehicle } from "@/lib/subscription";
import {
  addVehicleDocSchema,
  addVehicleSchema,
  deleteVehicleDocSchema,
  vehicleByIdSchema,
} from "@/lib/validation/vehicles";

/**
 * Traduce erorile ridicate de triggerul din DB
 * (`enforce_vehicle_subscription_rules`, migrarea 20260917100000) în mesaje
 * pentru utilizator.
 *
 * Verificăm regulile și în acțiune, înainte de insert, ca omul să primească
 * mesajul clar în majoritatea cazurilor. Dar DB-ul rămâne autoritatea: între
 * verificarea noastră și insert pot trece milisecunde în care trialul expiră
 * sau altcineva înregistrează aceeași plăcuță, iar un client care apelează
 * REST-ul direct ocolește complet codul ăsta.
 */
function subscriptionErrorMessage(dbMessage: string): string | null {
  if (dbMessage.includes("plate_trial_already_used")) {
    return "Acest vehicul a beneficiat deja de perioada gratuită. Fă upgrade la Premium (12 lei/an).";
  }
  if (dbMessage.includes("space_expired") || dbMessage.includes("trial_expired")) {
    return "Perioada gratuită de 1 an a expirat. Fă upgrade la Premium ca să adaugi vehicule.";
  }
  if (dbMessage.includes("plate_invalid")) {
    return "Numărul de înmatriculare nu e valid.";
  }
  return null;
}

async function revalidateSpace(spaceId: string) {
  const supabase = await createClient();
  const space = await fetchSpace(supabase, spaceId);
  if (space) revalidatePath(spacePath(space));
}

export async function addVehicleAction(spaceId: string, plate: string, vin: string) {
  const input = addVehicleSchema.parse({ spaceId, plate, vin });
  const supabase = await createClient();

  const space = await fetchSpace(supabase, input.spaceId);
  if (!space) throw new Error("Spațiul nu există sau nu ai acces la el.");

  // Verificare înainte de insert, pentru un mesaj clar. Nu înlocuiește
  // triggerul din DB — vezi comentariul de la subscriptionErrorMessage.
  const allowed = canAddVehicle(space);
  if (!allowed.allowed) throw new Error(allowed.reason);

  const { data: vehicle, error } = await supabase
    .from("vehicles")
    .insert({
      space_id: input.spaceId,
      plate: input.plate,
      vin: input.vin,
    })
    .select()
    .single();

  if (error) {
    const friendly = subscriptionErrorMessage(error.message);
    throw new Error(friendly ?? "Nu am putut adăuga vehiculul.");
  }
  if (!vehicle) throw new Error("Nu am putut adăuga vehiculul.");

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

  revalidatePath(spacePath(space));
  return { vehicle, docs: docRows ?? [] };
}

export async function softDeleteVehicleAction(id: string, spaceId: string) {
  const input = vehicleByIdSchema.parse({ id, spaceId });
  const supabase = await createClient();
  const { error } = await supabase
    .from("vehicles")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", input.id);
  if (error) throw new Error("Nu am putut șterge vehiculul.");
  await revalidateSpace(input.spaceId);
}

export async function undoDeleteVehicleAction(id: string, spaceId: string) {
  const input = vehicleByIdSchema.parse({ id, spaceId });
  const supabase = await createClient();
  const { error } = await supabase.from("vehicles").update({ deleted_at: null }).eq("id", input.id);
  if (error) throw new Error("Nu am putut anula ștergerea.");
  await revalidateSpace(input.spaceId);
}

export async function addVehicleDocAction(
  vehicleId: string,
  type: string,
  expiresAt: string,
  spaceId: string
) {
  const input = addVehicleDocSchema.parse({ vehicleId, type, expiresAt, spaceId });
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vehicle_docs")
    .insert({ vehicle_id: input.vehicleId, type: input.type, expires_at: input.expiresAt })
    .select()
    .single();
  if (error || !data) throw new Error("Nu am putut adăuga documentul.");
  await revalidateSpace(input.spaceId);
  return data;
}

export async function deleteVehicleDocAction(docId: string, spaceId: string) {
  const input = deleteVehicleDocSchema.parse({ docId, spaceId });
  const supabase = await createClient();
  const { error } = await supabase.from("vehicle_docs").delete().eq("id", input.docId);
  if (error) throw new Error("Nu am putut șterge documentul.");
  await revalidateSpace(input.spaceId);
}
