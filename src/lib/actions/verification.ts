"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sendVerificationResultEmail } from "@/lib/email/send-verification-result";
import { createVerificationNotification } from "@/lib/verificationNotification";
import { ADMIN_EMAIL, type VerificationResultValue } from "@/lib/constants";
import {
  attachVerificationEmailSchema,
  completeVerificationSchema,
  createVerificationRequestSchema,
} from "@/lib/validation/verification";
import { clientIp, limitAttachEmail, limitVerification, retryMessage } from "@/lib/ratelimit";

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
  // Rate limit înaintea parsării: o cerere respinsă aici nu trebuie să coste
  // nici măcar validare. Fiecare cerere acceptată declanșează muncă manuală
  // de la admin și consumă din cota de email (F-02).
  const limit = await limitVerification(await clientIp());
  if (!limit.allowed) {
    return { status: "error", error: retryMessage(limit.retryAfterSeconds) };
  }

  // Parsarea se face prima, înainte de orice altă procesare: inputul vine de
  // la un vizitator neautentificat. Schema normalizează plăcuța și plafonează
  // lungimile — vezi src/lib/validation/verification.ts.
  const parsed = createVerificationRequestSchema.safeParse({
    plate: String(formData.get("plate") ?? ""),
    email: String(formData.get("email") ?? ""),
  });

  if (!parsed.success) {
    // Primul mesaj e suficient: formularul are un singur câmp obligatoriu, iar
    // mesajele din schemă sunt deja scrise pentru utilizator.
    return { status: "error", error: parsed.error.issues[0].message };
  }

  const { plate, email } = parsed.data;

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

  // Adminul NU mai e notificat aici. Cererea rămâne cu admin_notified_at null
  // și intră în următorul digest (/api/cron/verification-digest), ca un val de
  // cereri automate să nu mai poată epuiza cota Resend de 100 email-uri/zi —
  // vezi F-02. Consumul devine proporțional cu timpul, nu cu traficul.

  return { status: "created", id, token, plate, hasAccount: userId !== null };
}

/**
 * Ecranul 2 (modal) — atașează emailul opțional pe cererea deja creată la
 * Ecranul 1. Trece prin RPC-ul `attach_verification_email` (SECURITY DEFINER)
 * fiindcă UPDATE direct pe tabelă e admin-only — vezi migrarea.
 */
export async function attachVerificationEmailAction(token: string, email: string) {
  // Public și neautentificat, lovește un RPC SECURITY DEFINER — are propria
  // limită, ca atașarea firească de după creare să nu consume din cele
  // 4 cereri/oră ale verificării.
  const limit = await limitAttachEmail(await clientIp());
  if (!limit.allowed) return;

  // Tokenul ajunge într-un RPC SECURITY DEFINER, iar emailul devine
  // destinatarul efectiv al rezultatului — ambele se validează înainte (F-06).
  const parsed = attachVerificationEmailSchema.safeParse({ token, email });
  if (!parsed.success) return;

  const supabase = await createClient();
  const { error } = await supabase.rpc("attach_verification_email", {
    p_token: parsed.data.token,
    p_email: parsed.data.email,
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
  const input = completeVerificationSchema.parse({ id, results });
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
      result_itp: input.results.itp,
      result_rca: input.results.rca,
      result_rovinieta: input.results.rovinieta,
      result_itp_expires: input.results.itpExpires,
      result_rca_expires: input.results.rcaExpires,
      result_rovinieta_expires: input.results.rovinietaExpires,
    })
    .eq("id", input.id)
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
