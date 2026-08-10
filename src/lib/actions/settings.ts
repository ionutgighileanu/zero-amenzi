"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/** Salvare automată la toggle (fără buton Save separat) — vezi
 * NotificationSettings.tsx. RLS (users_update_own) limitează update-ul la
 * propriul rând. */
export async function updateEmailNotificationsAction(enabled: boolean) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Neautentificat.");

  const { error } = await supabase
    .from("users")
    .update({ email_notifications: enabled })
    .eq("id", auth.user.id);

  if (error) throw new Error("Nu am putut salva preferința de email.");
  revalidatePath("/app/settings");
}
