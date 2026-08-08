"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function markNotificationReadAction(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("notifications_log")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error("Nu am putut marca notificarea ca citită.");
  revalidatePath("/app", "layout");
}

export async function markAllNotificationsReadAction(ids: string[]) {
  if (ids.length === 0) return;
  const supabase = await createClient();
  const { error } = await supabase
    .from("notifications_log")
    .update({ read_at: new Date().toISOString() })
    .in("id", ids);
  if (error) throw new Error("Nu am putut marca notificările ca citite.");
  revalidatePath("/app", "layout");
}
