import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin";
import { VerificationsAdminBoard } from "@/components/admin/VerificationsAdminBoard";

export const metadata: Metadata = {
  title: "Cereri de verificare — Admin",
  description:
    "Panou intern pentru gestionarea cererilor publice de verificare a actelor auto primite de la vizitatorii site-ului Zero Amenzi.",
};

export default async function AdminVerificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ request?: string }>;
}) {
  const { request } = await searchParams;
  // Garda rulează deja în layout; aici avem nevoie doar de client.
  const { supabase } = await requireAdmin();

  const { data: requests } = await supabase
    .from("verification_requests")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  return <VerificationsAdminBoard initialRequests={requests ?? []} highlightId={request} />;
}
