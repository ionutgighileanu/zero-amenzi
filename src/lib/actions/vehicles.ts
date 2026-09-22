"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { fetchSpace, spacePath } from "@/lib/spaces";
import { canAddVehicle, TRIAL_LIMIT_MESSAGE } from "@/lib/subscription";
import {
  PLATE_INPUT_MAX_LENGTH,
  PLATE_INVALID_MESSAGE,
  RO_PLATE_INPUT_MAX_LENGTH,
  RO_PLATE_REGEX,
} from "@/lib/constants";
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
  if (dbMessage.includes("trial_vehicle_limit")) {
    return TRIAL_LIMIT_MESSAGE;
  }
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

type ServerClient = Awaited<ReturnType<typeof createClient>>;

/**
 * Cererea de verificare legată de un vehicul (D-023) — la adăugare și la
 * „Am reînnoit un act — verifică din nou". Întoarce eroarea, nu aruncă:
 * apelanții decid ce înseamnă un eșec pentru ei.
 *
 * id/token generate aici, nu citite înapoi: un `.insert().select()` ar fi o
 * a doua rundă degeaba pentru un rând pe care nu-l folosim imediat.
 */
async function insertVerificationRequest(
  supabase: ServerClient,
  vehicle: { id: string; plate: string }
) {
  const { data: auth } = await supabase.auth.getUser();
  const { error } = await supabase.from("verification_requests").insert({
    id: randomUUID(),
    token: randomUUID(),
    plate_number: vehicle.plate,
    // Emailul contului: omul se așteaptă să primească rezultatul, nu doar
    // să-l găsească în clopoțel.
    email: auth.user?.email ?? null,
    user_id: auth.user?.id ?? null,
    vehicle_id: vehicle.id,
  });
  return error;
}

export async function addVehicleAction(spaceId: string, plate: string, vin: string) {
  // Fail-fast pe lungime, înaintea oricărei procesări: schema ar fi tăiat
  // tăcut la 32, dar un input de 5 000 de caractere nu e o greșeală de
  // tastare, e cineva care sare peste UI.
  if (plate.length > PLATE_INPUT_MAX_LENGTH) throw new Error(PLATE_INVALID_MESSAGE);

  const input = addVehicleSchema.parse({ spaceId, plate, vin });
  const supabase = await createClient();

  const space = await fetchSpace(supabase, input.spaceId);
  if (!space) throw new Error("Spațiul nu există sau nu ai acces la el.");

  // Garaj personal = plăcuță RO strictă, aceeași regulă ca la verificarea
  // publică. Flotele rămân permisive (camioane înmatriculate în afara RO).
  // Verificat pe server, nu doar în modal — UI-ul poate fi ocolit.
  if (
    space.kind === "personal" &&
    (input.plate.length > RO_PLATE_INPUT_MAX_LENGTH || !RO_PLATE_REGEX.test(input.plate))
  ) {
    throw new Error(PLATE_INVALID_MESSAGE);
  }

  // Verificare înainte de insert, pentru un mesaj clar. Nu înlocuiește
  // triggerul din DB — vezi comentariul de la subscriptionErrorMessage.
  //
  // `head: true` — avem nevoie doar de numărul de rânduri, nu de conținut.
  // Fără filtru pe `deleted_at`: un vehicul șters a consumat deja trialul
  // (D-024).
  const { count: unpaidCount } = await supabase
    .from("vehicles")
    .select("id", { count: "exact", head: true })
    .eq("space_id", input.spaceId)
    .or(`paid_until.is.null,paid_until.lte.${new Date().toISOString()}`);

  const allowed = canAddVehicle(space, unpaidCount ?? 0);
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

  // Documentele NU se inventează. Vehiculul intră în fluxul de verificare
  // (D-023): cererea ajunge în digestul adminului, iar datele reale se scriu
  // în vehicle_docs la completare — vezi completeVerificationAction. Până
  // atunci cardul arată „în verificare", nu buline verzi.
  const requestError = await insertVerificationRequest(supabase, vehicle);

  // Vehiculul există deja; un eșec aici nu-l anulează. Cardul rămâne cu
  // liniuțe (necunoscut), nu cu „în verificare" — ca să nu promită ceva ce nu
  // s-a înregistrat.
  if (requestError) {
    console.error("Vehicul creat, dar cererea de verificare a eșuat:", requestError);
  }

  revalidatePath(spacePath(space));
  return { vehicle, verificationPending: !requestError };
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

export type ReverifyResult = { ok: true; message: string } | { ok: false; error: string };

/**
 * „Am reînnoit un act — verifică din nou". Datele de pe card se schimbă doar
 * printr-o verificare, deci fără asta un act reînnoit în altă parte ar rămâne
 * „Expirat" pentru totdeauna. Creează o cerere nouă, pe același flux ca la
 * adăugare; la completare, rezultatul suprascrie documentele vehiculului.
 *
 * Întoarce rezultat în loc să arunce: în producție Next.js înlocuiește
 * mesajul erorilor aruncate din Server Actions cu un text generic.
 */
export async function requestReverificationAction(
  id: string,
  spaceId: string
): Promise<ReverifyResult> {
  const parsed = vehicleByIdSchema.safeParse({ id, spaceId });
  if (!parsed.success) return { ok: false, error: "Vehicul invalid." };

  const supabase = await createClient();
  const { data: vehicle } = await supabase
    .from("vehicles")
    .select("id, plate, space_id")
    .eq("id", parsed.data.id)
    .eq("space_id", parsed.data.spaceId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!vehicle) return { ok: false, error: "Vehiculul nu există sau nu ai acces la el." };

  // O singură verificare în curs per vehicul: o a doua ar dubla munca
  // adminului pentru același răspuns.
  const { data: open } = await supabase
    .from("verification_requests")
    .select("id")
    .eq("vehicle_id", vehicle.id)
    .eq("status", "pending")
    .limit(1);
  if (open && open.length > 0) {
    return { ok: true, message: "Verificarea e deja în curs. Te anunțăm când e gata." };
  }

  const error = await insertVerificationRequest(supabase, vehicle);
  if (error) {
    console.error("Cererea de re-verificare a eșuat:", error);
    return { ok: false, error: "Nu am putut porni verificarea. Încearcă din nou." };
  }

  await revalidateSpace(parsed.data.spaceId);
  return {
    ok: true,
    message: `Verificăm din nou actele pentru ${vehicle.plate}. Te anunțăm când sunt confirmate.`,
  };
}
