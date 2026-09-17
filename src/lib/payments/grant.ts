import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Tipurile `Update` din database.types.ts omit deliberat `paid_until` și
 * `subscription_status`: sunt revocate pentru clienți în DB, iar excluderea
 * lor face ca TypeScript să respingă orice încercare de a le scrie din codul
 * obișnuit. Fișierul ăsta e singura excepție legitimă — rulează cu
 * service_role, din webhook-ul de plată — așa că declarăm formele exact aici,
 * restrâns, în loc să lărgim tipurile globale și să pierdem protecția peste tot.
 */
type PaidUntilUpdate = { paid_until: string };
type SubscriptionStatusUpdate = { subscription_status: "trialing" | "active" | "expired" };

/**
 * Acordă acces plătit pe vehicule, după confirmarea unei plăți.
 *
 * Folosește service_role pentru că `vehicles.paid_until` are UPDATE revocat
 * pentru authenticated/anon (migrarea 20260917100000) — exact ca să nu-și
 * poată nimeni acorda singur Premium cu un PATCH pe REST. Singura cale
 * legitimă e prin funcția asta, apelată din webhook-ul de plată.
 *
 * Prelungirea pornește din `paid_until` existent dacă e în viitor, altfel din
 * momentul plății: cine reînnoiește din timp nu pierde zilele rămase.
 */
export type GrantResult = { granted: number; paidUntil: string };

export async function grantPaidAccess(
  spaceId: string,
  vehicleIds: string[],
  periodYears: number
): Promise<GrantResult> {
  if (vehicleIds.length === 0) return { granted: 0, paidUntil: "" };

  const supabase = createAdminClient();

  // Citim starea curentă ca să putem prelungi, nu doar suprascrie. Filtrăm și
  // pe space_id: un webhook nu trebuie să poată atinge vehicule din alt spațiu
  // chiar dacă payload-ul ar conține id-uri străine.
  const { data: rows, error } = await supabase
    .from("vehicles")
    .select("id, paid_until")
    .eq("space_id", spaceId)
    .in("id", vehicleIds);

  if (error) {
    console.error("[payments] nu am putut citi vehiculele pentru acordare:", error);
    throw new Error("grant_read_failed");
  }

  const now = Date.now();
  let lastPaidUntil = "";

  for (const row of rows ?? []) {
    const current = row.paid_until ? new Date(row.paid_until).getTime() : 0;
    const base = current > now ? current : now;
    const next = new Date(base);
    next.setFullYear(next.getFullYear() + periodYears);
    lastPaidUntil = next.toISOString();

    const { error: updateError } = await supabase
      .from("vehicles")
      .update({ paid_until: lastPaidUntil } as PaidUntilUpdate)
      .eq("id", row.id);

    if (updateError) {
      console.error(`[payments] nu am putut marca vehiculul ${row.id} ca plătit:`, updateError);
      throw new Error("grant_write_failed");
    }
  }

  // Prima plată dintr-un spațiu îl scoate din 'trialing'. Contează pentru
  // regula de acces: un spațiu 'active' nu mai consumă trial, deci poate
  // adăuga și plăcuțe care au mai fost în trial pe alt cont.
  const { error: spaceError } = await supabase
    .from("spaces")
    .update({ subscription_status: "active" } as SubscriptionStatusUpdate)
    .eq("id", spaceId);

  if (spaceError) {
    // Vehiculele sunt deja plătite și accesibile — regula de acces se uită
    // întâi la paid_until. Statusul spațiului e derivat, deci o eroare aici
    // nu blochează utilizatorul; o logăm ca să fie corectată de jobul de
    // expirare la următoarea rulare.
    console.error("[payments] plata a reușit, dar statusul spațiului n-a fost actualizat:", spaceError);
  }

  return { granted: (rows ?? []).length, paidUntil: lastPaidUntil };
}
