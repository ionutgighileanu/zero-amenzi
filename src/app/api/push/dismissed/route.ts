import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { uuidSchema } from "@/lib/validation/common";

/** Apelat din sw.ts la "notificationclose" — best-effort (browserul nu
 * garantează că cererea ajunge la timp la închiderea tab-ului). Marchează
 * push_dismissed_at, aceeași policy RLS ca la /api/push/clicked. */
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let notificationId: string | undefined;
  try {
    const body = await request.json();
    notificationId = body?.notificationId;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  // uuid explicit: fără asta un id malformat ajungea în Postgres și se
  // întorcea ca 500 generic în loc de 400 clar. RLS limitează oricum la
  // rândurile proprii, deci e igienă, nu barieră.
  if (!notificationId || !uuidSchema.safeParse(notificationId).success) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  const { error } = await supabase
    .from("notifications_log")
    .update({ push_dismissed_at: new Date().toISOString() })
    .eq("id", notificationId);

  if (error) {
    console.error("Nu am putut marca push-ul ca respins:", error);
    return NextResponse.json({ error: "update_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
