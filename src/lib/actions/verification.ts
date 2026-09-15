"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sendVerificationResultEmail } from "@/lib/email/send-verification-result";
import { sendNewVerificationRequestEmail } from "@/lib/email/send-new-verification-request";
import { createVerificationNotification } from "@/lib/verificationNotification";
import {
  ADMIN_EMAIL,
  PLATE_MAX_LENGTH,
  RO_PLATE_REGEX,
  type VerificationResultValue,
} from "@/lib/constants";

export type CreateVerificationState =
  | { status: "idle" }
  | { status: "error"; error: string }
  | { status: "created"; id: string; token: string; plate: string; hasAccount: boolean };

/**
 * Tokenul e generat aici, nu citit înapoi din DB — clientul anonim n-are
 * nicio policy de SELECT pe verification_requests (vezi migrarea), deci
 * un `.insert().select()` clasic ar eșua tăcut la partea de select. Insertul
 * primește tokenul deja gata generat; dacă eșuează, pur și simplu nu se
 * scrie nimic.
 */
export async function createVerificationRequestAction(
  _prevState: CreateVerificationState,
  formData: FormData
): Promise<CreateVerificationState> {
  // Plafonul de lungime se aplică ÎNAINTE de orice altceva: inputul vine de
  // la un vizitator neautentificat, iar coloana din DB e `text`, deci fără el
  // s-ar putea insera câmpuri de dimensiune arbitrară (F-05).
  const plateRaw = String(formData.get("plate") ?? "").slice(0, PLATE_MAX_LENGTH);
  // Normalizăm spațiile interne, ca „B12ABC", „b 12 abc" și „B  12  ABC" să
  // ajungă toate la aceeași formă canonică înainte de verificarea de format.
  const plate = plateRaw.trim().toUpperCase().replace(/\s+/g, " ");
  const emailRaw = String(formData.get("email") ?? "").trim();
  const email = emailRaw.length > 0 ? emailRaw : null;

  if (!RO_PLATE_REGEX.test(plate)) {
    return {
      status: "error",
      error: "Introdu un număr de înmatriculare valid (ex. B 12 ABC sau CJ 34 DEF).",
    };
  }

  // id + created_at generate aici, nu citite înapoi din DB — din același
  // motiv ca tokenul: clientul anonim n-are nicio policy de SELECT pe
  // verification_requests, deci un `.insert().select()` clasic ar eșua
  // tăcut la partea de select.
  const id = randomUUID();
  const token = randomUUID();
  const createdAt = new Date();
  const supabase = await createClient();

  // Dacă vizitatorul are sesiune, legăm cererea de contul lui — asta e
  // singurul lucru care face posibilă notificarea in-app la finalizare.
  // Policy-ul de INSERT acceptă doar user_id = auth.uid() sau null, deci o
  // cerere anonimă rămâne pur și simplu nelegată.
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id ?? null;

  const { error } = await supabase.from("verification_requests").insert({
    id,
    plate_number: plate,
    email,
    token,
    user_id: userId,
    created_at: createdAt.toISOString(),
  });

  if (error) {
    return { status: "error", error: "Nu am putut înregistra cererea. Încearcă din nou." };
  }

  // Notificare admin — best-effort, nu blochează crearea cererii dacă
  // trimiterea eșuează (vezi sendNewVerificationRequestEmail).
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  await sendNewVerificationRequestEmail({
    requestId: id,
    plate,
    createdAt: createdAt.toISOString(),
    appUrl,
  });

  return { status: "created", id, token, plate, hasAccount: userId !== null };
}

/**
 * Ecranul 2 (modal) — atașează emailul opțional pe cererea deja creată la
 * Ecranul 1. Trece prin RPC-ul `attach_verification_email` (SECURITY DEFINER)
 * fiindcă UPDATE direct pe tabelă e admin-only — vezi migrarea.
 */
export async function attachVerificationEmailAction(token: string, email: string) {
  const trimmed = email.trim();
  if (!trimmed) return;
  const supabase = await createClient();
  const { error } = await supabase.rpc("attach_verification_email", {
    p_token: token,
    p_email: trimmed,
  });
  if (error) console.error("Nu am putut atașa email-ul cererii de verificare:", error);
}

export type CompleteVerificationInput = {
  itp: VerificationResultValue;
  rca: VerificationResultValue;
  rovinieta: VerificationResultValue;
  itpExpires: string | null;
  rcaExpires: string | null;
  rovinietaExpires: string | null;
};

export async function completeVerificationAction(id: string, results: CompleteVerificationInput) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (auth.user?.email !== ADMIN_EMAIL) {
    throw new Error("Acces interzis.");
  }

  const { data: updated, error } = await supabase
    .from("verification_requests")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
      result_itp: results.itp,
      result_rca: results.rca,
      result_rovinieta: results.rovinieta,
      result_itp_expires: results.itpExpires,
      result_rca_expires: results.rcaExpires,
      result_rovinieta_expires: results.rovinietaExpires,
    })
    .eq("id", id)
    .select()
    .single();

  if (error || !updated) throw new Error("Nu am putut salva rezultatul.");

  if (updated.email) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    await sendVerificationResultEmail({
      to: updated.email,
      plate: updated.plate_number,
      requestId: updated.id,
      appUrl,
      itp: updated.result_itp,
      rca: updated.result_rca,
      rovinieta: updated.result_rovinieta,
      itpExpires: updated.result_itp_expires,
      rcaExpires: updated.result_rca_expires,
      rovinietaExpires: updated.result_rovinieta_expires,
    });
  }

  // Notificare in-app — doar dacă cererea e legată de un cont. Independentă
  // de email: o cerere poate avea cont fără email atașat și invers.
  if (updated.user_id) {
    await createVerificationNotification(updated);
  }

  revalidatePath("/admin/verifications");
  revalidatePath(`/verificare/status/${updated.id}`);
  revalidatePath("/app", "layout");
}
