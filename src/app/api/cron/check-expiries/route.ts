import { NextResponse } from "next/server";
import { checkExpiries, purgeOldVerificationRequests } from "@/lib/cron/check-expiries";
import { logSecurityEvent } from "@/lib/securityLog";

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
    logSecurityEvent("cron_unauthorized", {
      route: "check-expiries",
      ip: request.headers.get("x-real-ip") ?? undefined,
    });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await checkExpiries();
    // Retenție GDPR (D-031): ștergem cererile de verificare expirate în aceeași
    // cursă zilnică. Separat în try, ca o eroare de purge să nu piardă deja
    // raportul reușit al alertelor.
    let purged = 0;
    try {
      purged = await purgeOldVerificationRequests();
    } catch (err) {
      console.error("purge verification_requests a eșuat:", err);
    }
    return NextResponse.json({ ok: true, ...result, purged });
  } catch (err) {
    console.error("check-expiries a eșuat:", err);
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}
