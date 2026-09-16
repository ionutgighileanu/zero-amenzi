import { z } from "zod";
import { FIELD_MAX_LENGTH } from "@/lib/constants";
import { isoDateSchema, requiredText, uuidSchema } from "@/lib/validation/common";

const driverName = requiredText(FIELD_MAX_LENGTH.driverName, "Numele șoferului");

/**
 * Telefonul nu e validat ca format, doar ca lungime: flotele au și numere
 * străine, interioare, sau note de genul „0722... / 0733...". O regulă de
 * format ar respinge date reale fără să câștige nimic la securitate —
 * câmpul nu e folosit ca destinație de trimitere, doar afișat.
 */
const driverPhone = requiredText(FIELD_MAX_LENGTH.phone, "Telefonul");

export const addDriverSchema = z.object({
  orgId: uuidSchema,
  name: driverName,
  phone: driverPhone,
});

export const driverByIdSchema = z.object({
  id: uuidSchema,
  orgId: uuidSchema,
});

export const updateDriverSchema = z.object({
  id: uuidSchema,
  orgId: uuidSchema,
  patch: z.object({ name: driverName, phone: driverPhone }),
});

export const addDriverCertSchema = z.object({
  driverId: uuidSchema,
  type: requiredText(FIELD_MAX_LENGTH.docType, "Tipul atestatului"),
  expiresAt: isoDateSchema,
  orgId: uuidSchema,
});

export const deleteDriverCertSchema = z.object({
  certId: uuidSchema,
  orgId: uuidSchema,
});
