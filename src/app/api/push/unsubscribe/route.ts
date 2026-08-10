import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Șterge abonamentul push al browserului curent (dezactivare din Setări
 * sau curățare la eșec de subscribe). RLS limitează ștergerea la rândurile
 * proprii — nu mai e nevoie de o verificare explicită de user_id aici. */
export async function DELETE(request: Request) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let endpoint: string | undefined;
  try {
    const body = await request.json();
    endpoint = body?.endpoint;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!endpoint) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  const { error } = await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);

  if (error) {
    console.error("Nu am putut șterge subscription-ul push:", error);
    return NextResponse.json({ error: "delete_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
