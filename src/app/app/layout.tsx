import { redirect } from "next/navigation";
import { AppHeader, type Space } from "@/components/app/AppHeader";
import { MotionProvider } from "@/components/MotionProvider";
import { InstallBanner } from "@/components/ui/InstallBanner";
import { PushOnboarding } from "@/components/app/PushOnboarding";
import { VerificationNotifications } from "@/components/app/VerificationNotifications";
import { createClient } from "@/lib/supabase/server";
import type { NotificationItem } from "@/lib/notifications";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();

  // Middleware protejează /app/*, dar rămâne o barieră de siguranță aici.
  if (!auth.user) redirect("/login");

  // Interogări separate (nu embedded select) — tipurile Database sunt scrise
  // manual, fără metadata de Relationships necesară inferenței pe join-uri.
  const { data: memberships } = await supabase
    .from("memberships")
    .select("org_id")
    .eq("user_id", auth.user.id);

  const orgIds = (memberships ?? []).map((m) => m.org_id);
  const { data: orgs } = orgIds.length
    ? await supabase.from("organizations").select("id, name").in("id", orgIds)
    : { data: [] };

  const orgSpaces: Space[] = (orgs ?? []).map((org) => ({
    id: org.id,
    name: org.name,
    kind: "Flotă",
    href: `/app/fleet/${org.id}`,
  }));

  const notifications = await fetchUnreadNotifications(supabase, auth.user.id, orgIds);

  // Notificări in-app din tabela `notifications` (azi: verificări finalizate).
  // Separate de notifications_log/clopoțel — altă formă, alt tabel.
  const { data: inAppNotifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", auth.user.id)
    .is("read_at", null)
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <MotionProvider>
      <div className="min-h-screen bg-slate-50 text-slate-900 flex-1">
        <AppHeader email={auth.user.email ?? ""} orgSpaces={orgSpaces} notifications={notifications} />
        <VerificationNotifications initial={inAppNotifications ?? []} />
        {children}
        <InstallBanner />
        <PushOnboarding />
      </div>
    </MotionProvider>
  );
}

/** Notificări necitite (read_at IS NULL) pentru user + toate flotele lui —
 * interogări separate, nu embedded select (vezi nota de mai sus). */
async function fetchUnreadNotifications(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  orgIds: string[]
): Promise<NotificationItem[]> {
  const orFilter = orgIds.length
    ? `user_id.eq.${userId},org_id.in.(${orgIds.join(",")})`
    : `user_id.eq.${userId}`;

  const { data: rows } = await supabase
    .from("notifications_log")
    .select("*")
    .is("read_at", null)
    .or(orFilter)
    .order("sent_at", { ascending: false })
    .limit(30);

  const notifRows = rows ?? [];
  if (notifRows.length === 0) return [];

  const vehicleIds = [...new Set(notifRows.map((r) => r.vehicle_id).filter((id): id is string => !!id))];
  const driverIds = [...new Set(notifRows.map((r) => r.driver_id).filter((id): id is string => !!id))];

  const { data: vehicleRows } = vehicleIds.length
    ? await supabase.from("vehicles").select("id, plate").in("id", vehicleIds)
    : { data: [] };
  const { data: driverRows } = driverIds.length
    ? await supabase.from("drivers").select("id, name").in("id", driverIds)
    : { data: [] };

  const plateByVehicle = new Map((vehicleRows ?? []).map((v) => [v.id, v.plate]));
  const nameByDriver = new Map((driverRows ?? []).map((d) => [d.id, d.name]));

  return notifRows.map((r) => ({
    id: r.id,
    docType: r.doc_type,
    subjectLabel: r.vehicle_id
      ? plateByVehicle.get(r.vehicle_id) ?? "Vehicul șters"
      : nameByDriver.get(r.driver_id ?? "") ?? "Șofer șters",
    daysBefore: r.days_before ?? 0,
    expiresAt: r.expires_at ?? r.sent_at,
    href: r.org_id ? `/app/fleet/${r.org_id}` : "/app/garage",
  }));
}
