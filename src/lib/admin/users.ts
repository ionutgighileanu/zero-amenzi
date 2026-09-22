import { createAdminClient } from "@/lib/supabase/admin";
import { vehicleAccess, type SubscriptionStatus } from "@/lib/subscription";

/**
 * Datele pentru panoul de admin, citite cu service_role: ocolesc RLS, deci
 * văd toți utilizatorii, nu doar rândurile proprii. NU importa fișierul ăsta
 * dintr-o componentă de client: cheia service_role n-are voie să ajungă în
 * bundle-ul trimis browserului.
 *
 * Numărătorile se fac în memorie, dintr-un set mic de interogări. La volumul
 * actual (zeci de rânduri) e mai simplu și mai rapid decât agregări separate;
 * de la câteva mii de utilizatori merită paginare și un `count` în DB.
 */

export type AdminSpace = {
  id: string;
  kind: "personal" | "fleet";
  name: string;
  role: "owner" | "admin" | "member";
  isOwner: boolean;
  subscriptionStatus: SubscriptionStatus;
  trialEndsAt: string;
};

export type AdminVehicle = {
  id: string;
  spaceId: string;
  spaceName: string;
  plate: string;
  vin: string;
  paidUntil: string | null;
  deletedAt: string | null;
  access: "trial" | "paid" | "locked";
  createdAt: string;
};

export type AdminUserRow = {
  id: string;
  email: string;
  /** Contul există în auth.users dar nu în public.users — semn de drift. */
  missingProfile: boolean;
  createdAt: string | null;
  lastSignInAt: string | null;
  emailConfirmed: boolean;
  provider: string;
  emailNotifications: boolean;
  spaces: AdminSpace[];
  vehiclesActive: number;
  vehiclesDeleted: number;
  vehiclesPaid: number;
  requestsTotal: number;
  requestsPending: number;
  pushDevices: number;
  notificationsUnread: number;
};

export async function fetchAdminUsers(): Promise<AdminUserRow[]> {
  const admin = createAdminClient();

  const [{ data: authList }, profiles, spaces, memberships, vehicles, requests, push, notifications] =
    await Promise.all([
      admin.auth.admin.listUsers({ page: 1, perPage: 200 }),
      admin.from("users").select("id, email, email_notifications"),
      admin.from("spaces").select("id, kind, name, owner_id, subscription_status, trial_ends_at"),
      admin.from("memberships").select("user_id, space_id, role"),
      admin.from("vehicles").select("id, space_id, paid_until, deleted_at"),
      admin.from("verification_requests").select("user_id, status"),
      admin.from("push_subscriptions").select("user_id"),
      admin.from("notifications").select("user_id, read_at"),
    ]);

  const spaceById = new Map((spaces.data ?? []).map((s) => [s.id, s]));
  const profileById = new Map((profiles.data ?? []).map((p) => [p.id, p]));

  return (authList?.users ?? [])
    .map((authUser) => {
      const profile = profileById.get(authUser.id);
      const mySpaces = (memberships.data ?? [])
        .filter((m) => m.user_id === authUser.id)
        .map((m) => {
          const space = spaceById.get(m.space_id);
          if (!space) return null;
          return {
            id: space.id,
            kind: space.kind,
            name: space.name,
            role: m.role,
            isOwner: space.owner_id === authUser.id,
            subscriptionStatus: space.subscription_status,
            trialEndsAt: space.trial_ends_at,
          } satisfies AdminSpace;
        })
        .filter((s): s is AdminSpace => s !== null);

      const spaceIds = new Set(mySpaces.map((s) => s.id));
      const myVehicles = (vehicles.data ?? []).filter((v) => spaceIds.has(v.space_id));
      const now = new Date();
      const myRequests = (requests.data ?? []).filter((r) => r.user_id === authUser.id);

      return {
        id: authUser.id,
        email: authUser.email ?? profile?.email ?? "—",
        missingProfile: !profile,
        createdAt: authUser.created_at ?? null,
        lastSignInAt: authUser.last_sign_in_at ?? null,
        emailConfirmed: Boolean(authUser.email_confirmed_at),
        provider: authUser.app_metadata?.provider ?? "—",
        emailNotifications: profile?.email_notifications ?? true,
        spaces: mySpaces,
        vehiclesActive: myVehicles.filter((v) => !v.deleted_at).length,
        vehiclesDeleted: myVehicles.filter((v) => v.deleted_at).length,
        vehiclesPaid: myVehicles.filter((v) => v.paid_until && new Date(v.paid_until) > now).length,
        requestsTotal: myRequests.length,
        requestsPending: myRequests.filter((r) => r.status === "pending").length,
        pushDevices: (push.data ?? []).filter((p) => p.user_id === authUser.id).length,
        notificationsUnread: (notifications.data ?? []).filter(
          (n) => n.user_id === authUser.id && !n.read_at
        ).length,
      } satisfies AdminUserRow;
    })
    .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
}

export type AdminUserDetail = {
  user: AdminUserRow;
  vehicles: AdminVehicle[];
  docs: { vehicleId: string; type: string; expiresAt: string }[];
  requests: {
    id: string;
    plate: string;
    status: string;
    createdAt: string;
    completedAt: string | null;
    adminNotifiedAt: string | null;
    vehicleId: string | null;
  }[];
  pushEndpoints: { host: string; createdAt: string }[];
};

export async function fetchAdminUserDetail(userId: string): Promise<AdminUserDetail | null> {
  const users = await fetchAdminUsers();
  const user = users.find((u) => u.id === userId);
  if (!user) return null;

  const admin = createAdminClient();
  const spaceIds = user.spaces.map((s) => s.id);
  const spaceName = new Map(user.spaces.map((s) => [s.id, s.name]));

  const { data: vehicleRows } = spaceIds.length
    ? await admin
        .from("vehicles")
        .select("id, space_id, plate, vin, paid_until, deleted_at, created_at")
        .in("space_id", spaceIds)
        .order("created_at", { ascending: false })
    : { data: [] };

  const vehicleIds = (vehicleRows ?? []).map((v) => v.id);
  const [{ data: docRows }, { data: requestRows }, { data: pushRows }] = await Promise.all([
    vehicleIds.length
      ? admin.from("vehicle_docs").select("vehicle_id, type, expires_at").in("vehicle_id", vehicleIds)
      : Promise.resolve({ data: [] as { vehicle_id: string; type: string; expires_at: string }[] }),
    admin
      .from("verification_requests")
      .select("id, plate_number, status, created_at, completed_at, admin_notified_at, vehicle_id")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    admin.from("push_subscriptions").select("endpoint, created_at").eq("user_id", userId),
  ]);

  const spaceByVehicle = new Map(user.spaces.map((s) => [s.id, s]));

  return {
    user,
    vehicles: (vehicleRows ?? []).map((v) => {
      const space = spaceByVehicle.get(v.space_id);
      return {
        id: v.id,
        spaceId: v.space_id,
        spaceName: spaceName.get(v.space_id) ?? "—",
        plate: v.plate,
        vin: v.vin,
        paidUntil: v.paid_until,
        deletedAt: v.deleted_at,
        access: space
          ? vehicleAccess(
              { subscriptionStatus: space.subscriptionStatus, trialEndsAt: space.trialEndsAt },
              v.paid_until
            )
          : "locked",
        createdAt: v.created_at,
      } satisfies AdminVehicle;
    }),
    docs: (docRows ?? []).map((d) => ({
      vehicleId: d.vehicle_id,
      type: d.type,
      expiresAt: d.expires_at,
    })),
    requests: (requestRows ?? []).map((r) => ({
      id: r.id,
      plate: r.plate_number,
      status: r.status,
      createdAt: r.created_at,
      completedAt: r.completed_at,
      adminNotifiedAt: r.admin_notified_at,
      vehicleId: r.vehicle_id,
    })),
    // Doar host-ul: cheile de criptare ale abonamentului sunt secrete și
    // n-au ce căuta pe un ecran.
    pushEndpoints: (pushRows ?? []).map((p) => ({
      host: safeHost(p.endpoint),
      createdAt: p.created_at,
    })),
  };
}

function safeHost(endpoint: string): string {
  try {
    return new URL(endpoint).hostname;
  } catch {
    return "necunoscut";
  }
}
