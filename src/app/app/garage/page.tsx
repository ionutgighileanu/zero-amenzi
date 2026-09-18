import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_ALERT_TYPES } from "@/lib/constants";
import { mapVehicleRow } from "@/lib/vehicles";
import { fetchPersonalSpace } from "@/lib/spaces";
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

  // Spațiul personal e creat de triggerul de la signup. Dacă lipsește, contul
  // e dinainte de D-019 — trimitem spre creare de flotă în loc să arătăm un
  // garaj gol care nu acceptă nimic.
  const space = await fetchPersonalSpace(supabase, auth.user.id);
  if (!space) redirect("/app/organizations/new");

  const { data: vehicleRows } = await supabase
    .from("vehicles")
    .select("*")
    .eq("space_id", space.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  // Vehiculele neplătite, INCLUSIV cele soft-deleted — baza plafonului de
  // trial (D-024). Interogare separată tocmai pentru că cea de sus filtrează
  // `deleted_at`, iar un vehicul șters a consumat deja trialul.
  const { count: unpaidVehicleCount } = await supabase
    .from("vehicles")
    .select("id", { count: "exact", head: true })
    .eq("space_id", space.id)
    .or(`paid_until.is.null,paid_until.lte.${new Date().toISOString()}`);

  const vehicleIds = (vehicleRows ?? []).map((v) => v.id);
  const { data: docRows } = vehicleIds.length
    ? await supabase.from("vehicle_docs").select("*").in("vehicle_id", vehicleIds)
    : { data: [] };

  // Vehiculele cu cerere de verificare încă necompletată — cardul lor arată
  // „în verificare" în loc de liniuțe (D-023).
  const { data: pendingRows } = vehicleIds.length
    ? await supabase
        .from("verification_requests")
        .select("vehicle_id")
        .in("vehicle_id", vehicleIds)
        .eq("status", "pending")
    : { data: [] };
  const pendingIds = new Set((pendingRows ?? []).map((r) => r.vehicle_id));

  // Spațiul se pasează la mapare ca fiecare vehicul să-și cunoască starea de
  // acces (trial / paid / locked) — vezi src/lib/subscription.ts.
  const vehicles = (vehicleRows ?? []).map((row) =>
    mapVehicleRow(
      row,
      (docRows ?? []).filter((d) => d.vehicle_id === row.id),
      space,
      pendingIds.has(row.id)
    )
  );

  const { data: alertRows } = await supabase
    .from("alert_types")
    .select("name")
    .eq("space_id", space.id);
  const alertTypes = alertRows?.length ? alertRows.map((a) => a.name) : DEFAULT_ALERT_TYPES;

  return (
    <GarageBoard
      space={space}
      initialVehicles={vehicles}
      alertTypes={alertTypes}
      unpaidVehicleCount={unpaidVehicleCount ?? 0}
    />
  );
}
