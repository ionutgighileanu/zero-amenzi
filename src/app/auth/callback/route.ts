import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { PENDING_ORG_COOKIE } from "@/lib/constants";

/**
 * Ținta de emailRedirectTo / redirectTo pentru Supabase Auth: confirmare
 * email (signup) și OAuth (Google). Schimbă `code` pe o sesiune și, dacă
 * exista o intenție de firmă în așteptare, creează organizația abia acum.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      const cookieStore = await cookies();
      const pending = cookieStore.get(PENDING_ORG_COOKIE)?.value;

      if (pending) {
        cookieStore.delete(PENDING_ORG_COOKIE);
        try {
          const { name, cui } = JSON.parse(pending) as { name: string; cui: string };
          const { data: org } = await supabase
            .from("organizations")
            .insert({ name, cui: cui || null, owner_id: data.user.id })
            .select("id")
            .single();
          if (org) {
            return NextResponse.redirect(new URL(`/app/fleet/${org.id}`, url.origin));
          }
        } catch {
          // JSON invalid sau insert eșuat — continuăm spre garaj, nu blocăm login-ul.
        }
      }

      return NextResponse.redirect(new URL("/app/garage", url.origin));
    }
  }

  return NextResponse.redirect(new URL("/login?error=auth", url.origin));
}
