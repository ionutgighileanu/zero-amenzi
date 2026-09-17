import { z } from "zod";
import {
  FIELD_MAX_LENGTH,
  MAX_ALERTS,
  MAX_NOTIFICATIONS_PER_BATCH,
} from "@/lib/constants";
import {
  isoDateSchema,
  optionalText,
  requiredText,
  uuidSchema,
  spaceIdSchema,
} from "@/lib/validation/common";

/** Flote — createFleetSpaceAction. Numele „organization" a dispărut odată
 * cu tabelul; entitatea e acum un `space` cu kind='fleet'. */
export const createFleetSpaceSchema = z.object({
  name: requiredText(FIELD_MAX_LENGTH.orgName, "Numele firmei"),
  cui: optionalText(FIELD_MAX_LENGTH.cui, "CUI-ul"),
});

/**
 * Tipuri de alerte — saveAlertTypesAction rescrie toată lista dintr-un foc.
 * Plafonul pe lungimea listei e partea care contează: MAX_ALERTS exista doar
 * în AlertTypesModal, deci un apel direct la acțiune putea insera oricâte
 * rânduri. Numele duplicate se elimină, altfel lista rescrisă poate conține
 * același tip de mai multe ori.
 */
export const saveAlertTypesSchema = z.object({
  spaceId: spaceIdSchema,
  names: z
    .array(requiredText(FIELD_MAX_LENGTH.alertTypeName, "Numele alertei"))
    .max(MAX_ALERTS, { message: `Poți salva cel mult ${MAX_ALERTS} tipuri de alerte.` })
    .transform((values) => Array.from(new Set(values))),
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
