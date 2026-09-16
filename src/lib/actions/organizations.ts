"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createOrganizationSchema } from "@/lib/validation/misc-actions";

export type CreateOrgState = { error?: string } | null;

export async function createOrganizationAction(
  _prevState: CreateOrgState,
  formData: FormData
): Promise<CreateOrgState> {
  // Acțiunea întoarce eroarea în state, nu aruncă — deci safeParse, iar
  // mesajul din schemă e deja scris pentru utilizator.
  const parsed = createOrganizationSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    cui: String(formData.get("cui") ?? ""),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { name, cui } = parsed.data;
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login");

  const { data: org, error } = await supabase
    .from("organizations")
    .insert({ name, cui, owner_id: auth.user.id })
    .select("id")
    .single();

  if (error || !org) {
    return { error: "Nu am putut crea firma. Încearcă din nou." };
  }

  redirect(`/app/fleet/${org.id}`);
}
