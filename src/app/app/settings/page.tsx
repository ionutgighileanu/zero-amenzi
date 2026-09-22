import type { Metadata } from "next";
import Link from "next/link";
import { ADMIN_EMAIL } from "@/lib/constants";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fetchUserSpaces } from "@/lib/spaces";
import { NotificationSettings } from "@/components/app/NotificationSettings";
import { AccountDetails } from "@/components/app/AccountDetails";
import { AccountSecurity } from "@/components/app/AccountSecurity";
import { SubscriptionOverview, type OverviewVehicle } from "@/components/app/SubscriptionOverview";

export const metadata: Metadata = {
  title: "Setări cont — AutoDocs",
  description:
    "Datele contului, canalele de alertă, starea abonamentelor pe fiecare vehicul, deconectarea de pe toate dispozitivele și ștergerea contului.",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">{title}</h2>
      {children}
    </section>
  );
}

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login");
  const user = auth.user;

  const [{ data: userRow }, { count: pushCount }, spaces] = await Promise.all([
    supabase.from("users").select("email_notifications").eq("id", user.id).single(),
    supabase
      .from("push_subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id),
    fetchUserSpaces(supabase, user.id),
  ]);

  const { data: vehicleRows } = spaces.length
    ? await supabase
        .from("vehicles")
        .select("id, space_id, plate, paid_until")
        .in(
          "space_id",
          spaces.map((s) => s.id)
        )
        .is("deleted_at", null)
        .order("created_at", { ascending: true })
    : { data: [] };

  const vehicles: OverviewVehicle[] = (vehicleRows ?? []).map((v) => ({
    id: v.id,
    spaceId: v.space_id,
    plate: v.plate,
    paidUntil: v.paid_until,
  }));

  // Flotele în care userul e owner — cad odată cu contul (cascadă pe
  // spaces.owner_id), deci trebuie numite înainte de confirmarea ștergerii.
  const ownedFleetNames = spaces
    .filter((s) => s.kind === "fleet" && s.ownerId === user.id)
    .map((s) => s.name);

  const fullName =
    typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : "";

  return (
    <main className="max-w-xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight font-display">Setări cont</h1>
        <p className="text-sm text-slate-500 mt-1">
          Datele contului, alertele și abonamentele tale.
        </p>
      </div>

      <Section title="Cont">
        <AccountDetails
          initialName={fullName}
          email={user.email ?? ""}
          pendingEmail={user.new_email ?? null}
        />
      </Section>

      <Section title="Alerte">
        <NotificationSettings
          initialEmailEnabled={userRow?.email_notifications ?? true}
          initialPushEnabled={(pushCount ?? 0) > 0}
        />
      </Section>

      <Section title="Abonamente">
        <SubscriptionOverview spaces={spaces} vehicles={vehicles} />
      </Section>

      <Section title="Securitate">
        <AccountSecurity ownedFleetNames={ownedFleetNames} />
      </Section>

      <nav
        aria-label="Informații legale"
        className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-500 pt-2 border-t border-slate-200"
      >
        <Link href="/politica-confidentialitate" className="hover:text-slate-700 hover:underline">
          Politica de confidențialitate
        </Link>
        <Link href="/termeni" className="hover:text-slate-700 hover:underline">
          Termeni și condiții
        </Link>
        <a href={`mailto:${ADMIN_EMAIL}`} className="hover:text-slate-700 hover:underline">
          Contact
        </a>
      </nav>
    </main>
  );
}
