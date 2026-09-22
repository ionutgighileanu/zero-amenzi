import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { PENDING_ORG_COOKIE } from "@/lib/constants";

/**
 * Ținta de emailRedirectTo / redirectTo pentru Supabase Auth: confirmare
 * email (signup) și OAuth (Google). Schimbă `code` pe o sesiune și, dacă
 * exista o intenție de firmă în așteptare, creează organizația abia acum.
 */
/**
 * Destinația după autentificare. Acceptă doar căi din `/app/`: un `next`
 * arbitrar ar transforma callback-ul într-un open redirect — un link de
 * phishing pe domeniul nostru care trimite omul pe alt site după login.
 */
function safeNext(value: string | null): string {
  return value && value.startsWith("/app/") ? value : "/app/garage";
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = safeNext(url.searchParams.get("next"));

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
          // Flotă = space cu kind='fleet'. Statusul de abonament și trialul vin
          // din default-urile DB — au INSERT revocat pentru clienți.
          const { data: space } = await supabase
            .from("spaces")
            .insert({ kind: "fleet", name, cui: cui || null, owner_id: data.user.id })
            .select("id")
            .single();
          if (space) {
            return NextResponse.redirect(new URL(`/app/fleet/${space.id}`, url.origin));
          }
        } catch {
          // JSON invalid sau insert eșuat — continuăm spre garaj, nu blocăm login-ul.
        }
      }

      return NextResponse.redirect(new URL(next, url.origin));
    }

    // Confirmarea schimbării de email deschisă pe alt dispozitiv decât cel
    // care a pornit-o: schimbul de cod pică (verificatorul PKCE stă în
    // cookie-urile celuilalt browser), dar schimbarea s-a aplicat deja pe
    // serverul Supabase. Dacă omul are totuși o sesiune aici, nu-l trimitem
    // la „eroare de autentificare" pentru ceva ce a reușit.
    const { data: existing } = await supabase.auth.getUser();
    if (existing.user) return NextResponse.redirect(new URL(next, url.origin));
  }

  return NextResponse.redirect(new URL("/login?error=auth", url.origin));
}
