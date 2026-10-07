import { z } from "zod";
import { FIELD_MAX_LENGTH } from "@/lib/constants";
import { normalizePlate } from "@/lib/plate";
import { isoDateSchema, requiredText, spaceIdSchema, uuidSchema } from "@/lib/validation/common";

/**
 * Plăcuța la adăugarea unui vehicul.
 *
 * Deliberat mai permisivă decât la verificarea publică: acolo schema cere
 * format RO strict, fiindcă serviciul verifică acte românești. Aici o flotă
 * B2B poate avea camioane înmatriculate în afara României, deci acceptăm
 * orice text rezonabil — normalizePlate aduce plăcuțele RO la forma canonică
 * și le lasă neatinse pe celelalte.
 */
export const vehiclePlateSchema = z
  .string()
  .transform(normalizePlate)
  .refine((value) => value.length > 0, { message: "Numărul de înmatriculare este obligatoriu." });

/** 17 caractere, fără I, O, Q (ISO 3779) — oglindește `is_valid_vin` din DB.
 * VIN-ul e cheia anti-abuz a trialului (D-033), deci un text oarecare nu trece. */
export const VIN_REGEX = /^[A-HJ-NPR-Z0-9]{17}$/;

export const addVehicleSchema = z.object({
  spaceId: spaceIdSchema,
  plate: vehiclePlateSchema,
  vin: requiredText(FIELD_MAX_LENGTH.vin, "VIN-ul")
    .transform((value) => value.toUpperCase().replace(/[^A-Z0-9]/g, ""))
    .refine((value) => VIN_REGEX.test(value), {
      message: "Seria de șasiu (VIN) are 17 caractere — litere și cifre, fără I, O, Q.",
    }),
});

export const vehicleByIdSchema = z.object({
  id: uuidSchema,
  spaceId: spaceIdSchema,
});

export const changePlateSchema = z.object({
  id: uuidSchema,
  spaceId: spaceIdSchema,
  plate: vehiclePlateSchema,
});

export const addVehicleDocSchema = z.object({
  vehicleId: uuidSchema,
  type: requiredText(FIELD_MAX_LENGTH.docType, "Tipul documentului"),
  expiresAt: isoDateSchema,
  spaceId: spaceIdSchema,
});

export const deleteVehicleDocSchema = z.object({
  docId: uuidSchema,
  spaceId: spaceIdSchema,
});
