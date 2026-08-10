import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
