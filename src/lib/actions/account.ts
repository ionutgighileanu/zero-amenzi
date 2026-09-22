"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { SITE_URL } from "@/lib/constants";
import {
  deleteConfirmationSchema,
  emailSchema,
  fullNameSchema,
} from "@/lib/validation/account";

export type AccountResult = { ok: true; message: string } | { ok: false; error: string };

/** Numele stă în user_metadata din Supabase Auth, nu într-o coloană proprie:
 * Google îl completează deja acolo la login, deci o singură sursă. */
export async function updateNameAction(name: string): Promise<AccountResult> {
  const parsed = fullNameSchema.safeParse(name);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ data: { full_name: parsed.data } });
  if (error) return { ok: false, error: "Nu am putut salva numele. Încearcă din nou." };

  revalidatePath("/app/settings");
  return { ok: true, message: "Numele a fost salvat." };
}

/**
 * Schimbarea emailului trece prin Supabase Auth, cu confirmare pe adresă.
 * Adresa nu se schimbă la apăsarea butonului, ci la confirmare — iar abia
 * atunci triggerul on_auth_user_email_changed actualizează public.users,
 * de unde pleacă alertele (migrarea 20260922100000).
 */
export async function updateEmailAction(email: string): Promise<AccountResult> {
  const parsed = emailSchema.safeParse(email);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { ok: false, error: "Sesiunea a expirat. Autentifică-te din nou." };

  if (parsed.data.toLowerCase() === auth.user.email?.toLowerCase()) {
    return { ok: false, error: "Aceasta e deja adresa contului." };
  }

  const { error } = await supabase.auth.updateUser(
    { email: parsed.data },
    { emailRedirectTo: `${SITE_URL}/auth/callback?next=/app/settings` }
  );

  if (error) {
    if (/already|registered|exists/i.test(error.message)) {
      return { ok: false, error: "Adresa e deja folosită de alt cont." };
    }
    console.error("[account] schimbarea emailului a eșuat:", error);
    return { ok: false, error: "Nu am putut porni schimbarea emailului. Încearcă din nou." };
  }

  revalidatePath("/app/settings");
  return {
    ok: true,
    message:
      "Ți-am trimis un link de confirmare. Adresa se schimbă abia după ce confirmi — până atunci alertele pleacă tot la adresa actuală.",
  };
}

/** Invalidează toate sesiunile contului, inclusiv cea curentă. */
export async function signOutEverywhereAction() {
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "global" });
  redirect("/login");
}

/**
 * Ștergerea definitivă a contului (dreptul de ștergere, GDPR art. 17).
 *
 * Ce dispare, prin cascadele din DB: rândul din public.users, spațiul
 * personal, flotele deținute (cu vehiculele, documentele și șoferii lor —
 * inclusiv pentru ceilalți membri), membership-urile, abonamentele push și
 * notificările.
 *
 * Ce rămâne, deliberat:
 *   - plate_trials: plăcuțele își păstrează trialul consumat (first_space_id
 *     devine null). Altfel ștergerea contului ar fi o cale de a relua anul
 *     gratuit pentru aceeași mașină.
 *   - cererile publice de verificare: user_id devine null, iar emailul îl
 *     ștergem noi explicit mai jos, ca să nu rămână date personale legate de
 *     un cont care nu mai există.
 */
export async function deleteAccountAction(confirmation: string): Promise<AccountResult> {
  const parsed = deleteConfirmationSchema.safeParse(confirmation);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { ok: false, error: "Sesiunea a expirat. Autentifică-te din nou." };

  const userId = auth.user.id;
  const admin = createAdminClient();

  // Înaintea ștergerii: după ea, user_id devine null și nu mai știm care
  // cereri erau ale acestui utilizator.
  const { error: anonError } = await admin
    .from("verification_requests")
    .update({ email: null })
    .eq("user_id", userId);
  if (anonError) {
    console.error("[account] anonimizarea cererilor a eșuat:", anonError);
    return { ok: false, error: "Nu am putut șterge contul. Încearcă din nou." };
  }

  const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
  if (deleteError) {
    console.error("[account] ștergerea contului a eșuat:", deleteError);
    return { ok: false, error: "Nu am putut șterge contul. Încearcă din nou." };
  }

  // Doar curăță cookie-urile locale; sesiunile sunt deja invalide.
  await supabase.auth.signOut();
  redirect("/");
}
