import { z } from "zod";

/**
 * Primitive de validare refolosite de schemele acțiunilor (F-07).
 *
 * De ce contează și pentru acțiunile autentificate: un Server Action e un
 * endpoint HTTP obișnuit. Orice utilizator logat îl poate apela direct, cu ce
 * argumente vrea, fără să treacă prin interfață — deci o limită impusă doar
 * într-un modal (ex. plafonul de 17 caractere pe VIN din AddVehicleModal) nu
 * e o protecție.
 *
 * RLS rămâne bariera care decide CINE poate atinge un rând. Schemele astea
 * decid CE formă are ce se scrie în el.
 */

/** Identificator de rând. Toate cheile primare din schemă sunt uuid. */
export const uuidSchema = z.uuid({ message: "Identificator invalid." });

/**
 * Dată calendaristică pentru coloanele `date` (expires_at). Postgres ar
 * respinge oricum un format greșit, dar mesajul lui e opac pentru utilizator
 * și ajunge sus ca eșec generic de insert.
 */
export const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Data trebuie să fie în formatul AAAA-LL-ZZ." })
  .refine((value) => !Number.isNaN(Date.parse(value)), {
    message: "Data nu există în calendar.",
  });

/**
 * Text obligatoriu: elimină spațiile de la capete, refuză gol, plafonează
 * lungimea. Plafonul e verificat DUPĂ trim, ca un șir de 10.000 de spații să
 * nu treacă drept „scurt".
 */
export function requiredText(maxLength: number, label: string) {
  return z
    .string()
    .trim()
    .min(1, { message: `${label} este obligatoriu.` })
    .max(maxLength, { message: `${label} depășește ${maxLength} de caractere.` });
}

/** Ca `requiredText`, dar șirul gol devine `null` în loc de eroare. */
export function optionalText(maxLength: number, label: string) {
  return z
    .string()
    .trim()
    .max(maxLength, { message: `${label} depășește ${maxLength} de caractere.` })
    .transform((value) => (value.length > 0 ? value : null));
}

/**
 * Identificatorul spațiului care deține resursa.
 *
 * Înlocuiește vechiul vehicleScopeSchema (owner_id XOR org_id): de la D-019,
 * garajul personal e un rând real în `spaces`, la fel ca flotele, deci nu mai
 * există două forme de „scop" — e mereu un singur space_id.
 */
export const spaceIdSchema = uuidSchema;
