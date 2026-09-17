"use server";

import { createClient } from "@/lib/supabase/server";
import { fetchSpace, spacePath } from "@/lib/spaces";
import { VEHICLE_PRICE_RON_PER_YEAR } from "@/lib/subscription";
import { getPaymentProvider } from "@/lib/payments";
import type { CheckoutResult } from "@/lib/payments/types";
import { SITE_URL } from "@/lib/constants";
import { spaceIdSchema, uuidSchema } from "@/lib/validation/common";
import { z } from "zod";

const startUpgradeSchema = z.object({
  spaceId: spaceIdSchema,
  vehicleIds: z.array(uuidSchema).min(1, { message: "Alege cel puțin un vehicul." }).max(500),
  periodYears: z.number().int().min(1).max(5),
});

/**
 * Pornește plata pentru unul sau mai multe vehicule dintr-un spațiu.
 *
 * Suma se calculează AICI, pe server, din prețul din cod și din numărul de
 * vehicule verificate în DB. Nu se acceptă niciodată un total venit din
 * client — altfel oricine ar putea plăti 1 leu pentru 30 de mașini.
 */
export async function startUpgradeAction(
  spaceId: string,
  vehicleIds: string[],
  periodYears = 1
): Promise<CheckoutResult> {
  const parsed = startUpgradeSchema.safeParse({ spaceId, vehicleIds, periodYears });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { status: "error", message: "Trebuie să fii autentificat." };

  const space = await fetchSpace(supabase, parsed.data.spaceId);
  if (!space) return { status: "error", message: "Spațiul nu există sau nu ai acces la el." };

  // Vehiculele se recitesc din DB, sub RLS: dacă apelantul trimite id-uri din
  // alt spațiu sau inexistente, pur și simplu nu se regăsesc aici.
  const { data: vehicles } = await supabase
    .from("vehicles")
    .select("id")
    .eq("space_id", space.id)
    .in("id", parsed.data.vehicleIds)
    .is("deleted_at", null);

  const confirmedIds = (vehicles ?? []).map((v) => v.id);
  if (confirmedIds.length === 0) {
    return { status: "error", message: "Niciun vehicul valid de plătit." };
  }

  const amountMinor =
    confirmedIds.length * parsed.data.periodYears * VEHICLE_PRICE_RON_PER_YEAR * 100;

  const provider = getPaymentProvider();
  return provider.createCheckout({
    spaceId: space.id,
    spaceKind: space.kind,
    vehicleIds: confirmedIds,
    periodYears: parsed.data.periodYears,
    amountMinor,
    currency: "RON",
    customerEmail: auth.user.email ?? "",
    // Flotele primesc factură pe firmă; persoanele fizice, bon de card.
    billing:
      space.kind === "fleet" && space.cui
        ? { companyName: space.name, cui: space.cui }
        : undefined,
    returnUrl: `${SITE_URL}${spacePath(space)}?plata=reusita`,
    cancelUrl: `${SITE_URL}${spacePath(space)}?plata=anulata`,
  });
}
