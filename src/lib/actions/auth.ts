"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PENDING_ORG_COOKIE } from "@/lib/constants";
import { clientIp, limitLogin, limitSignup, retryMessage } from "@/lib/ratelimit";

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
  const limit = await limitLogin(await clientIp());
  if (!limit.allowed) {
    return { error: retryMessage(limit.retryAfterSeconds) };
  }

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const redirectTo = safeRedirect(String(formData.get("redirectTo") ?? "/app/garage"));

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "Email sau parolă greșite." };
  }

  redirect(redirectTo);
}

export async function signUpAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  // Fiecare înscriere trimite un email de confirmare din cota Resend.
  const limit = await limitSignup(await clientIp());
  if (!limit.allowed) {
    return { error: retryMessage(limit.retryAfterSeconds) };
  }

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const accountType = String(formData.get("accountType") ?? "B2C");
  const orgName = String(formData.get("orgName") ?? "").trim();
  const cui = String(formData.get("cui") ?? "").trim();

  if (accountType === "B2B" && !orgName) {
    return { error: "Numele firmei este obligatoriu pentru cont de firmă." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${appUrl()}/auth/callback` },
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

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
