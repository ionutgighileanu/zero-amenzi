import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

/**
 * Client cu service_role — ocolește RLS complet.
 * DOAR pentru cod server (webhooks, cron-uri de notificări). NU importa
 * acest fișier dintr-un Client Component sau dintr-un modul expus browser-ului:
 * cheia service_role nu trebuie să ajungă niciodată în bundle-ul de client.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
