import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { clientIp, limitVerificationStatus } from "@/lib/ratelimit";
import { toStatusResponse, type VerificationStatusResponse } from "@/lib/verificationStatus";
import { VERIFICATION_STATUS_CACHE_SECONDS } from "@/lib/constants";

/**
 * Statusul unei cereri de verificare, interogat periodic de pagina
 * /verificare/status/[id].
 *
 * Securitate: nu există autentificare aici, exact ca pe pagina de status.
 * `id` e un UUID v4 generat de server, deci neghicibil — cine îl are în URL
 * e, prin construcție, cel care a trimis cererea (sau cineva cu care a
 * partajat linkul). Citirea se face cu service_role fiindcă
 * verification_requests n-are policy publică de SELECT (vezi migrarea
 * 20260809184633): o policy `using (true)` ar permite oricui cu cheia anon
 * să listeze toate cererile, nu doar pe a lui.
 */

const TTL_MS = VERIFICATION_STATUS_CACHE_SECONDS * 1000;

type CacheEntry = { expiresAt: number; payload: VerificationStatusResponse | null };

// Cache per instanță de funcție: mai multe tab-uri (sau reîncercări ale
// aceluiași tab) care întreabă de aceeași cerere ating baza de date o
// singură dată per fereastră TTL. Se pierde la rece — acceptabil, e o
// optimizare, nu o sursă de adevăr.
const cache = new Map<string, CacheEntry>();

function readCache(id: string): CacheEntry | null {
  const hit = cache.get(id);
  if (!hit) return null;
  if (hit.expiresAt <= Date.now()) {
    cache.delete(id);
    return null;
  }
  return hit;
}

function writeCache(id: string, payload: VerificationStatusResponse | null) {
  // Curățăm intrările expirate la fiecare scriere — fără asta, Map-ul ar
  // crește nelimitat pe o instanță de lungă durată.
  const now = Date.now();
  for (const [key, entry] of cache) {
    if (entry.expiresAt <= now) cache.delete(key);
  }
  cache.set(id, { expiresAt: now + TTL_MS, payload });
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Ruta citește cu service_role și n-are autentificare, deci plafonul pe IP e
  // singura limită. Verificat înaintea cache-ului: altfel o rafală pe id-uri
  // diferite ar trece neatinsă, iar exact aceea e cea care ajunge la DB.
  const { allowed, retryAfterSeconds } = await limitVerificationStatus(await clientIp());
  if (!allowed) {
    return NextResponse.json(
      { error: "Prea multe cereri. Încearcă mai târziu." },
      {
        status: 429,
        headers: {
          "Cache-Control": "no-store",
          "Retry-After": String(Math.max(1, retryAfterSeconds)),
        },
      }
    );
  }

  const cached = readCache(id);
  if (cached) return respond(cached.payload);

  const supabase = createAdminClient();
  const { data: request, error } = await supabase
    .from("verification_requests")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  // O eroare de infrastructură nu se cache-uiește: clientul reîncearcă la
  // următorul ciclu de polling, iar între timp nu servim un 500 „lipit".
  if (error) {
    return NextResponse.json(
      { error: "Nu am putut citi statusul cererii." },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }

  const payload = request ? toStatusResponse(request) : null;
  writeCache(id, payload);
  return respond(payload);
}

function respond(payload: VerificationStatusResponse | null) {
  if (!payload) {
    return NextResponse.json(
      { error: "Cerere inexistentă." },
      { status: 404, headers: { "Cache-Control": "no-store" } }
    );
  }

  return NextResponse.json(payload, {
    headers: {
      // `private`: răspunsul conține plăcuța și datele documentelor, deci nu
      // are ce căuta într-un cache partajat (CDN/proxy), chiar dacă cheia
      // ar include id-ul.
      "Cache-Control": `private, max-age=${VERIFICATION_STATUS_CACHE_SECONDS}`,
    },
  });
}
