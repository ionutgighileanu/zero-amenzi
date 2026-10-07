"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PENDING_ORG_COOKIE, SITE_URL, MIN_PASSWORD_LENGTH } from "@/lib/constants";
import {
  clientIp,
  limitLogin,
  limitPasswordReset,
  limitSignup,
  retryMessage,
} from "@/lib/ratelimit";
import { logSecurityEvent } from "@/lib/securityLog";

export type AuthActionState = { error?: string; status?: "confirm-email" } | null;

function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

function safeRedirect(target: string) {
  return target.startsWith("/") ? target : "/app/garage";
}

export async function signInAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  // Înainte de a atinge Supabase: fără asta, forța brută pe parole e
  // nelimitată din partea noastră (F-02).
  const ip = await clientIp();
  const limit = await limitLogin(ip);
  if (!limit.allowed) {
    logSecurityEvent("login_rate_limited", { ip, retryAfterSeconds: limit.retryAfterSeconds });
    return { error: retryMessage(limit.retryAfterSeconds) };
  }

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const redirectTo = safeRedirect(String(formData.get("redirectTo") ?? "/app/garage"));

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // Fără email în log: un atac de credential stuffing e vizibil prin volumul
    // de eșecuri per IP, nu prin ce adrese a încercat.
    logSecurityEvent("login_failed", { ip });
    return { error: "Email sau parolă greșite." };
  }

  redirect(redirectTo);
}

export async function signUpAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  // Fiecare înscriere trimite un email de confirmare din cota Resend.
  const ip = await clientIp();
  const limit = await limitSignup(ip);
  if (!limit.allowed) {
    logSecurityEvent("signup_rate_limited", { ip, retryAfterSeconds: limit.retryAfterSeconds });
    return { error: retryMessage(limit.retryAfterSeconds) };
  }

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const accountType = String(formData.get("accountType") ?? "B2C");
  const orgName = String(formData.get("orgName") ?? "").trim();
  const cui = String(formData.get("cui") ?? "").trim();

  // Acceptarea termenilor (checkbox-ul din formular) e obligatorie și o
  // înregistrăm cu timestamp în metadata userului — dovada consimțământului,
  // legată de cont. Gardul din față e `required` pe input, ăsta e cel real.
  if (formData.get("acceptTerms") !== "on") {
    return { error: "Trebuie să accepți termenii și politica de confidențialitate." };
  }

  if (accountType === "B2B" && !orgName) {
    return { error: "Numele firmei este obligatoriu pentru cont de firmă." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${appUrl()}/auth/callback`,
      data: { terms_accepted_at: new Date().toISOString() },
    },
  });

  if (error) {
    return {
      error:
        error.message === "User already registered"
          ? "Există deja un cont cu acest email."
          : "Nu am putut crea contul. Încearcă din nou.",
    };
  }

  // Fără sesiune imediată = Supabase cere confirmare pe email. Punem
  // intenția de firmă la păstrare; /auth/callback o preia după confirmare.
  if (!data.session) {
    if (accountType === "B2B") {
      const cookieStore = await cookies();
      cookieStore.set(PENDING_ORG_COOKIE, JSON.stringify({ name: orgName, cui }), {
        maxAge: 3600,
        httpOnly: true,
        path: "/",
        sameSite: "lax",
      });
    }
    return { status: "confirm-email" };
  }

  if (accountType === "B2B" && data.user) {
    // Flotă = space cu kind='fleet'. Spațiul personal a fost deja creat de
    // triggerul de la signup, deci userul are unde pune mașini în ambele cazuri.
    const { data: space } = await supabase
      .from("spaces")
      .insert({ kind: "fleet", name: orgName, cui: cui || null, owner_id: data.user.id })
      .select("id")
      .single();

    if (space) redirect(`/app/fleet/${space.id}`);
  }

  redirect("/app/garage");
}

export type PasswordResetRequestState = { error?: string; status?: "sent" } | null;

/**
 * Pasul 1 din recuperarea parolei: trimite emailul cu linkul de resetare.
 *
 * Nu dezvăluie dacă adresa are cont (anti-enumerare): răspunsul e mereu același
 * „dacă există un cont, ți-am trimis link", iar `resetPasswordForEmail` nu
 * eșuează la adrese inexistente. Linkul duce prin /auth/callback (deja în
 * lista de redirect-uri permise din Supabase) spre /resetare-parola, unde
 * schimbul de cod produce o sesiune de recuperare.
 */
export async function requestPasswordResetAction(
  _prevState: PasswordResetRequestState,
  formData: FormData
): Promise<PasswordResetRequestState> {
  const ip = await clientIp();
  const limit = await limitPasswordReset(ip);
  if (!limit.allowed) {
    logSecurityEvent("password_reset_rate_limited", {
      ip,
      retryAfterSeconds: limit.retryAfterSeconds,
    });
    return { error: retryMessage(limit.retryAfterSeconds) };
  }

  const email = String(formData.get("email") ?? "").trim();
  if (!email) {
    return { error: "Introdu adresa de email." };
  }

  const supabase = await createClient();
  // Ignorăm intenționat eroarea pentru răspunsul către client (anti-enumerare),
  // dar o lăsăm în logul de securitate ca un volum anormal de cereri să se vadă.
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${SITE_URL}/auth/callback?next=/resetare-parola`,
  });
  logSecurityEvent("password_reset_requested", { ip });

  return { status: "sent" };
}

export type UpdatePasswordState = { error?: string } | null;

/**
 * Pasul 2: setează parola nouă. Rulează pe o sesiune activă — fie cea de
 * recuperare obținută din link, fie una normală (schimbarea parolei din cont).
 * Dacă nu există sesiune (link expirat sau deschis fără cod valid), trimite
 * omul înapoi la cererea de resetare.
 */
export async function updatePasswordAction(
  _prevState: UpdatePasswordState,
  formData: FormData
): Promise<UpdatePasswordState> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    return { error: "Link-ul de resetare a expirat sau e invalid. Cere unul nou." };
  }

  const password = String(formData.get("password") ?? "");
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { error: `Parola trebuie să aibă cel puțin ${MIN_PASSWORD_LENGTH} caractere.` };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return { error: "Nu am putut schimba parola. Încearcă din nou." };
  }

  logSecurityEvent("password_changed", { ip: await clientIp() });
  redirect("/app/garage");
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
