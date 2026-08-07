import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_ALERT_TYPES } from "@/lib/constants";
import { mapDriverRow, mapVehicleRow } from "@/lib/vehicles";
import { FleetBoard } from "@/components/app/FleetBoard";

export default async function FleetPage({ params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await params;
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login");

  // RLS ar bloca oricum interogările pentru non-membri, dar verificăm explicit
  // ca să redirecționăm curat spre garaj în loc să arătăm o flotă goală.
  const { data: membership } = await supabase
    .from("memberships")
    .select("role")
    .eq("org_id", orgId)
    .eq("user_id", auth.user.id)
    .maybeSingle();
  if (!membership) redirect("/app/garage");

  const { data: org } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", orgId)
    .single();

  const { data: vehicleRows } = await supabase
    .from("vehicles")
    .select("*")
    .eq("org_id", orgId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  const vehicleIds = (vehicleRows ?? []).map((v) => v.id);
  const { data: docRows } = vehicleIds.length
    ? await supabase.from("vehicle_docs").select("*").in("vehicle_id", vehicleIds)
    : { data: [] };
  const vehicles = (vehicleRows ?? []).map((row) =>
    mapVehicleRow(row, (docRows ?? []).filter((d) => d.vehicle_id === row.id))
  );

  const { data: driverRows } = await supabase
    .from("drivers")
    .select("*")
    .eq("org_id", orgId)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  const driverIds = (driverRows ?? []).map((d) => d.id);
  const { data: certRows } = driverIds.length
    ? await supabase.from("driver_certs").select("*").in("driver_id", driverIds)
    : { data: [] };
  const drivers = (driverRows ?? []).map((row) =>
    mapDriverRow(row, (certRows ?? []).filter((c) => c.driver_id === row.id))
  );

  const { data: alertRows } = await supabase
    .from("alert_types")
    .select("name")
    .eq("org_id", orgId);
  const alertTypes = alertRows?.length ? alertRows.map((a) => a.name) : DEFAULT_ALERT_TYPES;

  return (
    <FleetBoard
      orgId={orgId}
      orgName={org?.name ?? orgId}
      initialVehicles={vehicles}
      initialDrivers={drivers}
      initialAlertTypes={alertTypes}
    />
  );
}
