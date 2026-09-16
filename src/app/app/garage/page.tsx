import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_ALERT_TYPES } from "@/lib/constants";
import { mapVehicleRow } from "@/lib/vehicles";
import { GarageBoard } from "@/components/app/GarageBoard";

export const metadata: Metadata = {
  title: "Garajul meu — AutoDocs",
  description:
    "Garajul tău personal: toate mașinile, documentele și datele lor de expirare într-un singur loc, cu alerte automate înainte să expire ceva.",
};

export default async function GaragePage() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login");

  const { data: vehicleRows } = await supabase
    .from("vehicles")
    .select("*")
    .eq("owner_id", auth.user.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  const vehicleIds = (vehicleRows ?? []).map((v) => v.id);
  const { data: docRows } = vehicleIds.length
    ? await supabase.from("vehicle_docs").select("*").in("vehicle_id", vehicleIds)
    : { data: [] };

  const vehicles = (vehicleRows ?? []).map((row) =>
    mapVehicleRow(row, (docRows ?? []).filter((d) => d.vehicle_id === row.id))
  );

  const { data: alertRows } = await supabase
    .from("alert_types")
    .select("name")
    .eq("owner_id", auth.user.id);
  const alertTypes = alertRows?.length ? alertRows.map((a) => a.name) : DEFAULT_ALERT_TYPES;

  return (
    <GarageBoard ownerId={auth.user.id} initialVehicles={vehicles} initialAlertTypes={alertTypes} />
  );
}
