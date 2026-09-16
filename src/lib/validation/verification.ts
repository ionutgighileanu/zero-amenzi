import { z } from "zod";
import { EMAIL_MAX_LENGTH, RO_PLATE_REGEX } from "@/lib/constants";
import { normalizePlate } from "@/lib/plate";

/**
 * Scheme de validare pentru acțiunile publice din src/lib/actions/verification.ts.
 *
 * Toate acceptă input de la vizitatori neautentificați, deci parsarea se face
 * la intrarea în acțiune, înainte de orice altă procesare — vezi F-03, F-05,
 * F-06, F-07 din audit. Regexul și plafoanele stau în constants.ts, ca să
 * existe o singură definiție per regulă.
 */

/**
 * Plăcuța: normalizarea plafonează inputul brut (coloana din DB e `text`, deci
 * fără plafon s-ar putea insera câmpuri arbitrare) și produce forma canonică
 * unică — „b12abc", „B-12-ABC" și „B  12  ABC" ajung toate la „B 12 ABC", deci
 * aceeași mașină are o singură reprezentare în baza de date.
 */
export const plateSchema = z
  .string()
  .transform(normalizePlate)
  .refine((value) => RO_PLATE_REGEX.test(value), {
    message: "Introdu un număr de înmatriculare valid (ex. B 12 ABC sau CJ 34 DEF).",
  });

/**
 * Emailul: plafonul de 254 e limita din RFC 5321. Contează dincolo de igiena
 * datelor, fiindcă adresa devine destinatarul efectiv al emailului de rezultat
 * — e input de încredere zero care ajunge în câmpul `to`.
 */
export const emailSchema = z
  .string()
  .trim()
  .max(EMAIL_MAX_LENGTH, { message: "Adresa de email e prea lungă." })
  .pipe(z.email({ message: "Introdu o adresă de email validă." }));

/** Emailul e opțional la crearea cererii: șirul gol devine `null`, nu eroare. */
export const optionalEmailSchema = z
  .string()
  .trim()
  .transform((value) => (value.length > 0 ? value : null))
  .refine((value) => value === null || value.length <= EMAIL_MAX_LENGTH, {
    message: "Adresa de email e prea lungă.",
  })
  .refine((value) => value === null || z.email().safeParse(value).success, {
    message: "Introdu o adresă de email validă.",
  });

/** Ecranul 1 — cererea propriu-zisă. */
export const createVerificationRequestSchema = z.object({
  plate: plateSchema,
  email: optionalEmailSchema,
});

/**
 * Ecranul 2 — atașarea emailului pe o cerere existentă. Tokenul e validat ca
 * UUID: fără asta, orice șir ajungea în RPC, iar acțiunea n-avea nicio
 * verificare în afară de „emailul nu e gol" (F-06).
 */
export const attachVerificationEmailSchema = z.object({
  token: z.uuid({ message: "Token invalid." }),
  email: emailSchema,
});

/**
 * Completarea rezultatului de către admin. Acțiunea e deja gate-uită pe
 * ADMIN_EMAIL, iar DB-ul are CHECK pe valorile rezultatului — schema e
 * pentru consistență cu restul acțiunilor (F-07) și pentru un mesaj clar în
 * loc de un eșec opac de update.
 */
const resultValueSchema = z.enum(["valid", "expirat", "nu_gasit"]);
const optionalDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Data trebuie să fie în formatul AAAA-LL-ZZ." })
  .nullable();

export const completeVerificationSchema = z.object({
  id: z.uuid({ message: "Identificator invalid." }),
  results: z.object({
    itp: resultValueSchema,
    rca: resultValueSchema,
    rovinieta: resultValueSchema,
    itpExpires: optionalDateSchema,
    rcaExpires: optionalDateSchema,
    rovinietaExpires: optionalDateSchema,
  }),
});

export type CreateVerificationRequestInput = z.infer<typeof createVerificationRequestSchema>;
export type AttachVerificationEmailInput = z.infer<typeof attachVerificationEmailSchema>;
