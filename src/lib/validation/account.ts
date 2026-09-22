import { z } from "zod";
import { FIELD_MAX_LENGTH } from "@/lib/constants";
import { requiredText } from "@/lib/validation/common";

export { emailSchema } from "@/lib/validation/verification";

export const fullNameSchema = requiredText(FIELD_MAX_LENGTH.fullName, "Numele");

/** Cuvântul pe care utilizatorul îl tastează ca să confirme ștergerea. */
export const DELETE_CONFIRMATION_WORD = "ȘTERGE";

/**
 * Acceptă și „STERGE" fără diacritice: pe o tastatură de telefon fără
 * română, „Ș" e greu de găsit, iar confirmarea ar deveni o barieră de
 * tastatură, nu o barieră de intenție.
 */
export function isDeleteConfirmed(value: string): boolean {
  const normalize = (s: string) =>
    s.trim().toUpperCase().normalize("NFD").replace(/\p{M}/gu, "");
  return normalize(value) === normalize(DELETE_CONFIRMATION_WORD);
}

export const deleteConfirmationSchema = z
  .string()
  .max(20)
  .refine(isDeleteConfirmed, { message: `Scrie ${DELETE_CONFIRMATION_WORD} ca să confirmi.` });
