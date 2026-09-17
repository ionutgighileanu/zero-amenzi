import { clientIp, limitCspReport } from "@/lib/ratelimit";

/**
 * Colectorul de rapoarte CSP (D-021).
 *
 * Neautentificat prin necesitate: browserul trimite raportul fără cookie-uri
 * și fără sesiune, deci nu există user de verificat. Singura protecție e rate
 * limiting-ul pe IP — de-aia nu scriem nimic în baza de date aici, doar în
 * loguri. Un endpoint public care face INSERT ar fi o suprafață de abuz.
 *
 * Primește două formate, fiindcă emitem și `report-uri` și `report-to`:
 *  - vechi  (report-uri): Content-Type application/csp-report,
 *           corp `{ "csp-report": { ... } }`
 *  - nou    (Reporting API): Content-Type application/reports+json,
 *           corp `[ { type: "csp-violation", body: { ... } } ]`
 *
 * Întoarce mereu 204: browserul nu face nimic cu un cod de eroare de aici, iar
 * un 4xx/5xx ar umple consola utilizatorului cu zgomot pe lângă violarea reală.
 */

// Rapoartele legitime au sub 2 KB. Plafonul oprește un POST de câțiva MB
// trimis manual către un endpoint public.
const MAX_BODY_BYTES = 16 * 1024;

const noContent = () => new Response(null, { status: 204 });

type ViolationFields = {
  documentURL?: string;
  blockedURL?: string;
  effectiveDirective?: string;
  originalPolicy?: string;
  sourceFile?: string;
  lineNumber?: number;
  disposition?: string;
};

/** Normalizează ambele formate la aceleași câmpuri. Formatul vechi folosește
 * chei cu cratimă (`blocked-uri`), cel nou camelCase (`blockedURL`). */
function normalize(report: Record<string, unknown>): ViolationFields {
  const pick = (...keys: string[]) => {
    for (const key of keys) {
      const value = report[key];
      if (value !== undefined && value !== null && value !== "") return value;
    }
    return undefined;
  };

  return {
    documentURL: pick("documentURL", "document-uri") as string | undefined,
    blockedURL: pick("blockedURL", "blocked-uri") as string | undefined,
    effectiveDirective: pick(
      "effectiveDirective",
      "effective-directive",
      "violatedDirective",
      "violated-directive"
    ) as string | undefined,
    sourceFile: pick("sourceFile", "source-file") as string | undefined,
    lineNumber: pick("lineNumber", "line-number") as number | undefined,
    disposition: pick("disposition") as string | undefined,
  };
}

export async function POST(request: Request) {
  const ip = await clientIp();
  const { allowed } = await limitCspReport(ip);
  if (!allowed) return noContent();

  const raw = await request.text();
  if (raw.length === 0 || raw.length > MAX_BODY_BYTES) return noContent();

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return noContent();
  }

  // Un POST `application/reports+json` poate conține mai multe violări.
  const reports: Record<string, unknown>[] = Array.isArray(parsed)
    ? parsed
        .filter((entry): entry is Record<string, unknown> => typeof entry === "object" && entry !== null)
        .map((entry) => (entry.body as Record<string, unknown>) ?? entry)
    : typeof parsed === "object" && parsed !== null
      ? [((parsed as Record<string, unknown>)["csp-report"] as Record<string, unknown>) ?? (parsed as Record<string, unknown>)]
      : [];

  for (const report of reports) {
    const v = normalize(report);
    console.warn("[csp] violare raportată", {
      directive: v.effectiveDirective ?? "necunoscută",
      blocked: v.blockedURL ?? "necunoscut",
      document: v.documentURL ?? "necunoscut",
      source: v.sourceFile ? `${v.sourceFile}:${v.lineNumber ?? "?"}` : undefined,
      // "report" = Report-Only, "enforce" = politica blochează efectiv.
      disposition: v.disposition ?? "report",
    });
  }

  return noContent();
}
