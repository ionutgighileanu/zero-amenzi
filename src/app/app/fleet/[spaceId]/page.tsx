import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_ALERT_TYPES } from "@/lib/constants";
import { mapDriverRow, mapVehicleRow } from "@/lib/vehicles";
import type { Database } from "@/lib/supabase/database.types";
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

  // Cele două verificări de acces nu depind una de alta — doar de spaceId /
  // user.id — deci pornesc în paralel în loc să aștepte una după alta.
  const [{ data: membership }, space] = await Promise.all([
    // RLS ar bloca oricum interogările pentru non-membri, dar verificăm explicit
    // ca să redirecționăm curat spre garaj în loc să arătăm o flotă goală.
    supabase
      .from("memberships")
      .select("role")
      .eq("space_id", spaceId)
      .eq("user_id", auth.user.id)
      .maybeSingle(),
    fetchSpace(supabase, spaceId),
  ]);
  if (!membership) redirect("/app/garage");
  // Un spațiu personal accesat pe ruta de flotă înseamnă URL greșit — îl
  // trimitem pe ruta lui, nu îi arătăm tabelul B2B.
  if (!space || space.kind !== "fleet") redirect("/app/garage");

  // Al doilea val: patru interogări independente între ele, care au nevoie
  // doar de spaceId — porneau una după alta, acum pornesc deodată.
  const [{ data: vehicleRows }, { count: unpaidVehicleCount }, { data: driverRows }, { data: alertRows }] =
    await Promise.all([
      supabase
        .from("vehicles")
        .select("*")
        .eq("space_id", spaceId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false }),
      // Vehiculele neplătite, inclusiv soft-deleted — baza plafonului de trial
      // (D-024). Se aplică identic la flote și la garajul personal.
      supabase
        .from("vehicles")
        .select("id", { count: "exact", head: true })
        .eq("space_id", spaceId)
        .or(`paid_until.is.null,paid_until.lte.${new Date().toISOString()}`),
      supabase
        .from("drivers")
        .select("*")
        .eq("space_id", spaceId)
        .is("deleted_at", null)
        .order("created_at", { ascending: true }),
      supabase.from("alert_types").select("name").eq("space_id", spaceId),
    ]);

  const vehicleIds = (vehicleRows ?? []).map((v) => v.id);
  const driverIds = (driverRows ?? []).map((d) => d.id);

  // Al treilea val: depinde de id-urile de mai sus, dar cele trei interogări
  // nu depind una de alta.
  const [{ data: docRows }, { data: pendingRows }, { data: certRows }] = await Promise.all([
    vehicleIds.length
      ? supabase.from("vehicle_docs").select("*").in("vehicle_id", vehicleIds)
      : Promise.resolve({ data: [] as Database["public"]["Tables"]["vehicle_docs"]["Row"][] }),
    vehicleIds.length
      ? supabase
          .from("verification_requests")
          .select("vehicle_id")
          .in("vehicle_id", vehicleIds)
          .eq("status", "pending")
      : Promise.resolve({ data: [] as { vehicle_id: string | null }[] }),
    driverIds.length
      ? supabase.from("driver_certs").select("*").in("driver_id", driverIds)
      : Promise.resolve({ data: [] as Database["public"]["Tables"]["driver_certs"]["Row"][] }),
  ]);

  const pendingIds = new Set((pendingRows ?? []).map((r) => r.vehicle_id));
  const vehicles = (vehicleRows ?? []).map((row) =>
    mapVehicleRow(
      row,
      (docRows ?? []).filter((d) => d.vehicle_id === row.id),
      space,
      pendingIds.has(row.id)
    )
  );
  const drivers = (driverRows ?? []).map((row) =>
    mapDriverRow(row, (certRows ?? []).filter((c) => c.driver_id === row.id))
  );
  const alertTypes = alertRows?.length ? alertRows.map((a) => a.name) : DEFAULT_ALERT_TYPES;

  return (
    <FleetBoard
      space={space}
      initialVehicles={vehicles}
      initialDrivers={drivers}
      alertTypes={alertTypes}
      unpaidVehicleCount={unpaidVehicleCount ?? 0}
    />
  );
}
