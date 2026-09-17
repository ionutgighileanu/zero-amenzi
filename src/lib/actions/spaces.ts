"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createFleetSpaceSchema } from "@/lib/validation/misc-actions";

export type CreateSpaceState = { error?: string } | null;

/**
 * Creează o flotă — un `space` cu kind='fleet'.
 *
 * subscription_status și trial_ends_at NU se trimit: au INSERT revocat pentru
 * clienți (migrarea 20260917100000) și vin din default-urile DB, deci nimeni
 * nu-și poate acorda singur un trial mai lung sau status 'active'.
 * Membership-ul de owner îl creează triggerul on_space_created.
 */
export async function createFleetSpaceAction(
  _prevState: CreateSpaceState,
  formData: FormData
): Promise<CreateSpaceState> {
  // Acțiunea întoarce eroarea în state, nu aruncă — deci safeParse, iar
  // mesajul din schemă e deja scris pentru utilizator.
  const parsed = createFleetSpaceSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    cui: String(formData.get("cui") ?? ""),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { name, cui } = parsed.data;
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login");

  const { data: space, error } = await supabase
    .from("spaces")
    .insert({ kind: "fleet", name, cui, owner_id: auth.user.id })
    .select("id")
    .single();

  if (error || !space) {
    return { error: "Nu am putut crea firma. Încearcă din nou." };
  }

  redirect(`/app/fleet/${space.id}`);
}
