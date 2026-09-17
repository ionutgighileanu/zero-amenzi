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

export const addVehicleSchema = z.object({
  spaceId: spaceIdSchema,
  plate: vehiclePlateSchema,
  vin: requiredText(FIELD_MAX_LENGTH.vin, "VIN-ul").transform((value) => value.toUpperCase()),
});

export const vehicleByIdSchema = z.object({
  id: uuidSchema,
  spaceId: spaceIdSchema,
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
