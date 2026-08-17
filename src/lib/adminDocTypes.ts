import { CORE_DOC_TYPES } from "@/lib/vehicles";

/** Sentinelă pentru opțiunea „Alt tip…” din selectul de tip document —
 * nu e un tip real, doar comută afișarea câmpului de text liber. */
export const OTHER_DOC_TYPE = "__other__";

/** Opțiunile din selectul de tip document, folosite atât la adăugare cât
 * și la actualizare (AddDocumentModal / UpdateDocumentModal). */
export const DOC_TYPE_OPTIONS = [
  { value: CORE_DOC_TYPES.rca, label: CORE_DOC_TYPES.rca },
  { value: CORE_DOC_TYPES.itp, label: CORE_DOC_TYPES.itp },
  { value: CORE_DOC_TYPES.rovinieta, label: CORE_DOC_TYPES.rovinieta },
  { value: CORE_DOC_TYPES.tahograf, label: CORE_DOC_TYPES.tahograf },
  { value: OTHER_DOC_TYPE, label: "Alt tip…" },
] as const;

const KNOWN_DOC_TYPES: readonly string[] = DOC_TYPE_OPTIONS.map((o) => o.value).filter(
  (v) => v !== OTHER_DOC_TYPE
);

/** Pentru un tip existent (venit din DB), decide dacă selectul arată direct
 * tipul cunoscut sau „Alt tip…” cu textul liber precompletat. */
export function splitDocType(type: string): { select: string; custom: string } {
  return KNOWN_DOC_TYPES.includes(type)
    ? { select: type, custom: "" }
    : { select: OTHER_DOC_TYPE, custom: type };
}
