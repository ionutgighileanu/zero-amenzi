import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { VehicleDetails } from "@/components/admin/VehicleDetails";

export const metadata: Metadata = {
  title: "Vehicul — Admin",
  description:
    "Panou intern pentru adăugarea și actualizarea manuală a documentelor unui vehicul: ITP, RCA, rovinietă și alte tipuri de alerte configurate.",
};

export default async function AdminVehiclePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireAdmin();

  const { data: vehicle } = await supabase.from("vehicles").select("*").eq("id", id).single();
  if (!vehicle) notFound();

  const { data: docs } = await supabase
    .from("vehicle_docs")
    .select("*")
    .eq("vehicle_id", id)
    .order("created_at", { ascending: true });

  return <VehicleDetails vehicle={vehicle} initialDocs={docs ?? []} />;
}
