import { NextResponse } from "next/server";
import { getPaymentProvider } from "@/lib/payments";
import { grantPaidAccess } from "@/lib/payments/grant";

/**
 * Endpoint-ul pe care îl apelează procesatorul de plată după o tranzacție.
 *
 * ── AICI AJUNGE CONFIRMAREA PLĂȚII ────────────────────────────────────────
 * URL-ul de configurat în panoul procesatorului:
 *   https://zero-amenzi.vercel.app/api/payments/webhook
 *
 * Ruta nu știe nimic despre procesator: îi dă corpul brut providerului, care
 * verifică semnătura și traduce în { status: "paid", spaceId, vehicleIds }.
 * Doar atunci se acordă accesul.
 * ──────────────────────────────────────────────────────────────────────────
 *
 * Nu are autentificare de sesiune — procesatorul nu are cookie-uri. Securitatea
 * vine exclusiv din verificarea semnăturii, făcută de provider. Cât timp nu e
 * configurat niciunul, orice cerere primește 400.
 */
export async function POST(request: Request) {
  // Corpul BRUT, nu JSON parsat: semnătura se calculează pe octeții exacți,
  // iar un parse + stringify ar invalida-o.
  const rawBody = await request.text();

  const provider = getPaymentProvider();
  const result = await provider.handleWebhook(rawBody, request.headers);

  if (result.status === "invalid") {
    return NextResponse.json({ error: result.message }, { status: 400 });
  }

  if (result.status === "ignored") {
    // 200, ca procesatorul să nu reîncerce la nesfârșit un eveniment pe care
    // l-am înțeles dar care nu ne privește.
    return NextResponse.json({ ok: true, ignored: result.reason });
  }

  try {
    const granted = await grantPaidAccess(result.spaceId, result.vehicleIds, result.periodYears);
    return NextResponse.json({ ok: true, ...granted });
  } catch (err) {
    console.error("[payments] plata confirmată dar acordarea a eșuat:", err);
    // 500 intenționat: procesatoarele reîncearcă webhook-urile eșuate, iar noi
    // chiar vrem o reîncercare — clientul a plătit și încă n-are acces.
    return NextResponse.json({ error: "grant_failed" }, { status: 500 });
  }
}
