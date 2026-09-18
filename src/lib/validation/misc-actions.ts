import { z } from "zod";
import { FIELD_MAX_LENGTH, MAX_NOTIFICATIONS_PER_BATCH } from "@/lib/constants";
import {
  isoDateSchema,
  optionalText,
  requiredText,
  uuidSchema,
} from "@/lib/validation/common";

/** Flote — createFleetSpaceAction. Numele „organization" a dispărut odată
 * cu tabelul; entitatea e acum un `space` cu kind='fleet'. */
export const createFleetSpaceSchema = z.object({
  name: requiredText(FIELD_MAX_LENGTH.orgName, "Numele firmei"),
  cui: optionalText(FIELD_MAX_LENGTH.cui, "CUI-ul"),
});

/** Notificări — marcare ca citit, individual sau în lot. */
export const notificationIdSchema = uuidSchema;

export const notificationIdsSchema = z
  .array(uuidSchema)
  .max(MAX_NOTIFICATIONS_PER_BATCH, {
    message: `Poți marca cel mult ${MAX_NOTIFICATIONS_PER_BATCH} notificări deodată.`,
  });

/** Setări — toggle-ul de notificări pe email. */
export const emailNotificationsSchema = z.boolean();

/** Panoul de admin — documente pe vehicul. */
export const adminAddVehicleDocSchema = z.object({
  vehicleId: uuidSchema,
  type: requiredText(FIELD_MAX_LENGTH.docType, "Tipul documentului"),
  expiresAt: isoDateSchema,
});

export const adminUpdateVehicleDocSchema = z.object({
  docId: uuidSchema,
  vehicleId: uuidSchema,
  patch: z.object({
    type: requiredText(FIELD_MAX_LENGTH.docType, "Tipul documentului"),
    expiresAt: isoDateSchema,
  }),
});
