"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sendVerificationResultEmail } from "@/lib/email/send-verification-result";
import { ADMIN_EMAIL, type VerificationResultValue } from "@/lib/constants";

export type CreateVerificationState =
  | { status: "idle" }
  | { status: "error"; error: string }
  | { status: "created"; token: string; plate: string };

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
  const plate = String(formData.get("plate") ?? "").trim().toUpperCase();
  const emailRaw = String(formData.get("email") ?? "").trim();
  const email = emailRaw.length > 0 ? emailRaw : null;

  if (plate.length < 4) {
    return { status: "error", error: "Introdu un număr de înmatriculare valid." };
  }

  const token = randomUUID();
  const supabase = await createClient();
  const { error } = await supabase.from("verification_requests").insert({
    plate_number: plate,
    email,
    token,
  });

  if (error) {
    return { status: "error", error: "Nu am putut înregistra cererea. Încearcă din nou." };
  }

  return { status: "created", token, plate };
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
      token: updated.token,
      appUrl,
      itp: updated.result_itp,
      rca: updated.result_rca,
      rovinieta: updated.result_rovinieta,
      itpExpires: updated.result_itp_expires,
      rcaExpires: updated.result_rca_expires,
      rovinietaExpires: updated.result_rovinieta_expires,
    });
  }

  revalidatePath("/admin/verifications");
}
