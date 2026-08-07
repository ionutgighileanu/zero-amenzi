"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type CreateOrgState = { error?: string } | null;

export async function createOrganizationAction(
  _prevState: CreateOrgState,
  formData: FormData
): Promise<CreateOrgState> {
  const name = String(formData.get("name") ?? "").trim();
  const cui = String(formData.get("cui") ?? "").trim();

  if (!name) return { error: "Numele firmei este obligatoriu." };

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login");

  const { data: org, error } = await supabase
    .from("organizations")
    .insert({ name, cui: cui || null, owner_id: auth.user.id })
    .select("id")
    .single();

  if (error || !org) {
    return { error: "Nu am putut crea firma. Încearcă din nou." };
  }

  redirect(`/app/fleet/${org.id}`);
}
