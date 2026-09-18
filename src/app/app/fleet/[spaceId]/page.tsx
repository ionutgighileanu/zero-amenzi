import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_ALERT_TYPES } from "@/lib/constants";
import { mapDriverRow, mapVehicleRow } from "@/lib/vehicles";
import { fetchSpace } from "@/lib/spaces";
import { FleetBoard } from "@/components/app/FleetBoard";

export const metadata: Metadata = {
  title: "Flota — AutoDocs",
  description:
    "Panoul flotei: toate vehiculele și șoferii firmei, cu starea documentelor și alerte centralizate înainte de expirarea actelor sau atestatelor.",
};

export default async function FleetPage({ params }: { params: Promise<{ spaceId: string }> }) {
  const { spaceId } = await params;
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login");

  // RLS ar bloca oricum interogările pentru non-membri, dar verificăm explicit
  // ca să redirecționăm curat spre garaj în loc să arătăm o flotă goală.
  const { data: membership } = await supabase
    .from("memberships")
    .select("role")
    .eq("space_id", spaceId)
    .eq("user_id", auth.user.id)
    .maybeSingle();
  if (!membership) redirect("/app/garage");

  const space = await fetchSpace(supabase, spaceId);
  // Un spațiu personal accesat pe ruta de flotă înseamnă URL greșit — îl
  // trimitem pe ruta lui, nu îi arătăm tabelul B2B.
  if (!space || space.kind !== "fleet") redirect("/app/garage");

  const { data: vehicleRows } = await supabase
    .from("vehicles")
    .select("*")
    .eq("space_id", spaceId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  const vehicleIds = (vehicleRows ?? []).map((v) => v.id);
  const { data: docRows } = vehicleIds.length
    ? await supabase.from("vehicle_docs").select("*").in("vehicle_id", vehicleIds)
    : { data: [] };
  const { data: pendingRows } = vehicleIds.length
    ? await supabase
        .from("verification_requests")
        .select("vehicle_id")
        .in("vehicle_id", vehicleIds)
        .eq("status", "pending")
    : { data: [] };
  const pendingIds = new Set((pendingRows ?? []).map((r) => r.vehicle_id));

  const vehicles = (vehicleRows ?? []).map((row) =>
    mapVehicleRow(
      row,
      (docRows ?? []).filter((d) => d.vehicle_id === row.id),
      space,
      pendingIds.has(row.id)
    )
  );

  const { data: driverRows } = await supabase
    .from("drivers")
    .select("*")
    .eq("space_id", spaceId)
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
    .eq("space_id", spaceId);
  const alertTypes = alertRows?.length ? alertRows.map((a) => a.name) : DEFAULT_ALERT_TYPES;

  return (
    <FleetBoard
      space={space}
      initialVehicles={vehicles}
      initialDrivers={drivers}
      alertTypes={alertTypes}
    />
  );
}
