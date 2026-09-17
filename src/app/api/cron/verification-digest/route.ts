import { NextResponse } from "next/server";
import { sendVerificationDigest } from "@/lib/cron/verification-digest";

/**
 * Apelat de Vercel Cron (vezi vercel.json). Grupează cererile noi de
 * verificare într-un singur email către admin, în loc de unul per cerere —
 * vezi F-02 și migrarea 20260916100000.
 *
 * Aceeași autentificare ca /api/cron/check-expiries: Vercel adaugă automat
 * `Authorization: Bearer $CRON_SECRET`, iar orice cerere fără secretul corect
 * e respinsă, ca nimeni din afară să nu poată declanșa trimiterea.
 */
export async function GET(request: Request) {
  // Vezi comentariul din check-expiries: fără guard, un secret nesetat
  // transforma ruta în endpoint public prin „Bearer undefined".
  if (!process.env.CRON_SECRET) {
    console.error("[cron] CRON_SECRET nesetat — refuz să rulez verification-digest.");
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 503 });
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await sendVerificationDigest();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("verification-digest a eșuat:", err);
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}
