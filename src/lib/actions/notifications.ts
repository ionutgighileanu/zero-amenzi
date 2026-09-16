"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { notificationIdSchema, notificationIdsSchema } from "@/lib/validation/misc-actions";

export async function markNotificationReadAction(id: string) {
  notificationIdSchema.parse(id);
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
  const validIds = notificationIdsSchema.parse(ids);
  const supabase = await createClient();
  const { error } = await supabase
    .from("notifications_log")
    .update({ read_at: new Date().toISOString() })
    .in("id", validIds);
  if (error) throw new Error("Nu am putut marca notificările ca citite.");
  revalidatePath("/app", "layout");
}
