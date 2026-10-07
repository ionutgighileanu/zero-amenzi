"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import { fetchSpace, spacePath } from "@/lib/spaces";
import {
  canAddVehicle,
  PLATE_CHANGES_PER_YEAR,
  TRIAL_ALREADY_USED_MESSAGE,
  TRIAL_LIMIT_MESSAGE,
} from "@/lib/subscription";
import { clientIp } from "@/lib/ratelimit";
import { logSecurityEvent } from "@/lib/securityLog";
import {
  PLATE_INPUT_MAX_LENGTH,
  PLATE_INVALID_MESSAGE,
  RO_PLATE_INPUT_MAX_LENGTH,
  RO_PLATE_REGEX,
} from "@/lib/constants";
import {
  addVehicleDocSchema,
  addVehicleSchema,
  changePlateSchema,
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
    return "Acest număr de înmatriculare a beneficiat deja de perioada gratuită. Fă upgrade la Premium (12 lei/an).";
  }
  if (dbMessage.includes("vin_trial_already_used")) {
    return "Această mașină (aceeași serie de șasiu) a beneficiat deja de perioada gratuită. Dacă doar i s-a schimbat numărul, folosește „Schimbă numărul de înmatriculare” din meniul vehiculului. Altfel, fă upgrade la Premium (12 lei/an).";
  }
  if (dbMessage.includes("trial_already_used_by_email")) {
    return TRIAL_ALREADY_USED_MESSAGE;
  }
  if (dbMessage.includes("vin_invalid")) {
    return "Seria de șasiu (VIN) are 17 caractere — litere și cifre, fără I, O, Q.";
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

type VehicleRow = Database["public"]["Tables"]["vehicles"]["Row"];

export type AddVehicleResult =
  | { ok: true; vehicle: VehicleRow; verificationPending: boolean }
  | { ok: false; error: string };

/**
 * Întoarce rezultat în loc să arunce: în producție Next.js înlocuiește
 * mesajul erorilor aruncate din Server Actions cu un text generic, iar aici
 * mesajul e chiar răspunsul pentru om („mașina a avut deja trial — schimbă
 * numărul din meniu").
 */
export async function addVehicleAction(
  spaceId: string,
  plate: string,
  vin: string
): Promise<AddVehicleResult> {
  // Fail-fast pe lungime, înaintea oricărei procesări: schema ar fi tăiat
  // tăcut la 32, dar un input de 5 000 de caractere nu e o greșeală de
  // tastare, e cineva care sare peste UI.
  if (plate.length > PLATE_INPUT_MAX_LENGTH) return { ok: false, error: PLATE_INVALID_MESSAGE };

  const parsed = addVehicleSchema.safeParse({ spaceId, plate, vin });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const input = parsed.data;
  const supabase = await createClient();

  const space = await fetchSpace(supabase, input.spaceId);
  if (!space) return { ok: false, error: "Spațiul nu există sau nu ai acces la el." };

  // Garaj personal = plăcuță RO strictă, aceeași regulă ca la verificarea
  // publică. Flotele rămân permisive (camioane înmatriculate în afara RO).
  // Verificat pe server, nu doar în modal — UI-ul poate fi ocolit.
  if (
    space.kind === "personal" &&
    (input.plate.length > RO_PLATE_INPUT_MAX_LENGTH || !RO_PLATE_REGEX.test(input.plate))
  ) {
    return { ok: false, error: PLATE_INVALID_MESSAGE };
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
  if (!allowed.allowed) return { ok: false, error: allowed.reason };

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
    // Plăcuța, VIN-ul sau emailul au mai avut trial (de obicei: cont nou
    // pentru aceeași mașină). Fără date în log — doar IP și moment.
    if (/plate_trial_already_used|vin_trial_already_used|trial_already_used_by_email/.test(error.message)) {
      logSecurityEvent("trial_reuse_blocked", { ip: await clientIp() });
    }
    const friendly = subscriptionErrorMessage(error.message);
    if (!friendly) console.error("Adăugarea vehiculului a eșuat:", error);
    return { ok: false, error: friendly ?? "Nu am putut adăuga vehiculul." };
  }
  if (!vehicle) return { ok: false, error: "Nu am putut adăuga vehiculul." };

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
  return { ok: true, vehicle, verificationPending: !requestError };
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

const PLATE_CHANGE_ERRORS: Record<string, string> = {
  plate_change_limit: `Ai atins limita de ${PLATE_CHANGES_PER_YEAR} schimbări de număr pe an pentru acest vehicul. Scrie-ne dacă e o situație specială.`,
  plate_unchanged: "Acesta e deja numărul vehiculului.",
  plate_invalid: PLATE_INVALID_MESSAGE,
  plate_trial_already_used:
    "Acest număr a beneficiat deja de perioada gratuită pe alt vehicul. Fă upgrade la Premium (12 lei/an).",
  vehicle_not_found: "Vehiculul nu există sau nu ai drept să-l modifici.",
};

/**
 * Schimbarea numărului de înmatriculare (reînmatriculare, număr personalizat).
 * Vehiculul — și deci VIN-ul și trialul lui — rămâne același; doar plăcuța se
 * schimbă. Plafonul anual stă în DB (`change_vehicle_plate`), ca să nu poată
 * fi ocolit apelând REST-ul direct (D-033).
 *
 * Actele afișate erau ale numărului vechi, deci pornim o verificare nouă.
 */
export async function changeVehiclePlateAction(
  id: string,
  spaceId: string,
  plate: string
): Promise<ReverifyResult> {
  if (plate.length > PLATE_INPUT_MAX_LENGTH) return { ok: false, error: PLATE_INVALID_MESSAGE };

  const parsed = changePlateSchema.safeParse({ id, spaceId, plate });
  if (!parsed.success) return { ok: false, error: PLATE_INVALID_MESSAGE };

  const supabase = await createClient();
  const space = await fetchSpace(supabase, parsed.data.spaceId);
  if (!space) return { ok: false, error: "Spațiul nu există sau nu ai acces la el." };

  if (
    space.kind === "personal" &&
    (parsed.data.plate.length > RO_PLATE_INPUT_MAX_LENGTH || !RO_PLATE_REGEX.test(parsed.data.plate))
  ) {
    return { ok: false, error: PLATE_INVALID_MESSAGE };
  }

  const { error } = await supabase.rpc("change_vehicle_plate", {
    p_vehicle_id: parsed.data.id,
    p_new_plate: parsed.data.plate,
  });

  if (error) {
    const code = Object.keys(PLATE_CHANGE_ERRORS).find((c) => error.message.includes(c));
    if (!code) console.error("Schimbarea numărului a eșuat:", error);
    return {
      ok: false,
      error: code ? PLATE_CHANGE_ERRORS[code] : "Nu am putut schimba numărul. Încearcă din nou.",
    };
  }

  const requestError = await insertVerificationRequest(supabase, {
    id: parsed.data.id,
    plate: parsed.data.plate,
  });
  if (requestError) console.error("Număr schimbat, dar cererea de verificare a eșuat:", requestError);

  revalidatePath(spacePath(space));
  return {
    ok: true,
    message: `Numărul a fost schimbat în ${parsed.data.plate}. Verificăm actele pe numărul nou.`,
  };
}
