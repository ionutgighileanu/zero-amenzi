import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NotificationSettings } from "@/components/app/NotificationSettings";

export const metadata: Metadata = {
  title: "Preferințe alerte — AutoDocs",
  description:
    "Alege cum vrei să primești alertele înainte de expirarea actelor auto: pe email, prin notificări push sau în aplicație. Le poți schimba oricând.",
};

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login");

  const { data: userRow } = await supabase
    .from("users")
    .select("email_notifications")
    .eq("id", auth.user.id)
    .single();

  const { count: pushCount } = await supabase
    .from("push_subscriptions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", auth.user.id);

  return (
    <main className="max-w-md mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-xl font-extrabold tracking-tight font-display">Preferințe alerte</h1>
      <p className="text-sm text-slate-500 mt-1 mb-6">
        Alegi canalele prin care primești alerte de expirare a documentelor.
      </p>
      <NotificationSettings
        initialEmailEnabled={userRow?.email_notifications ?? true}
        initialPushEnabled={(pushCount ?? 0) > 0}
      />
    </main>
  );
}
