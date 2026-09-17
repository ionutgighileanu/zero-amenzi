import { NextResponse } from "next/server";
import { checkExpiries } from "@/lib/cron/check-expiries";

/**
 * Apelat de Vercel Cron (vezi vercel.json, 08:00 UTC zilnic). Vercel adaugă
 * automat header-ul `Authorization: Bearer $CRON_SECRET` pe cererile
 * declanșate de cron — orice altă cerere fără secretul corect e respinsă,
 * ca nimeni din afară să nu poată declanșa manual trimiterea de alerte.
 */
export async function GET(request: Request) {
  // Fără guardul ăsta, un CRON_SECRET nesetat făcea ca valoarea așteptată să
  // devină literal "Bearer undefined" — deci oricine trimitea exact headerul
  // acela declanșa trimiterea de alerte și consuma cota Resend.
  if (!process.env.CRON_SECRET) {
    console.error("[cron] CRON_SECRET nesetat — refuz să rulez check-expiries.");
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 503 });
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await checkExpiries();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("check-expiries a eșuat:", err);
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}
