import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAllowedPushEndpoint } from "@/lib/push/allowed-endpoints";

type SubscribeBody = {
  endpoint?: string;
  keys?: { p256dh?: string; auth?: string };
};

/**
 * Salvează un abonament PushManager al browserului curent pentru userul
 * autentificat. Nu face upsert: la resubscribe (aceeași pereche user+endpoint)
 * șterge rândul vechi și inserează unul nou — evită să avem nevoie de o
 * policy RLS de UPDATE pe push_subscriptions (vezi migrația).
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: SubscribeBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const { endpoint, keys } = body;
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  // Cheile reale au ~88 (p256dh) și ~24 (auth) caractere base64url. Fără
  // plafon, coloanele `text` acceptau orice dimensiune; același plafon e și
  // CHECK în DB (migrarea 20260916120000), aici doar dăm 400 în loc de 500.
  if (
    typeof keys.p256dh !== "string" ||
    typeof keys.auth !== "string" ||
    keys.p256dh.length > 256 ||
    keys.auth.length > 256 ||
    endpoint.length > 2048
  ) {
    return NextResponse.json({ error: "invalid_fields" }, { status: 400 });
  }

  // Fără asta, un endpoint arbitrar salvat aici devine, la fiecare alertă, o
  // cerere HTTP a serverului către oriunde a ales atacatorul (F-04) — vezi
  // src/lib/push/allowed-endpoints.ts.
  if (!isAllowedPushEndpoint(endpoint)) {
    return NextResponse.json({ error: "invalid_endpoint" }, { status: 400 });
  }

  await supabase
    .from("push_subscriptions")
    .delete()
    .eq("user_id", auth.user.id)
    .eq("endpoint", endpoint);

  const { error } = await supabase.from("push_subscriptions").insert({
    user_id: auth.user.id,
    endpoint,
    p256dh: keys.p256dh,
    auth: keys.auth,
  });

  if (error) {
    console.error("Nu am putut salva subscription-ul push:", error);
    return NextResponse.json({ error: "insert_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
