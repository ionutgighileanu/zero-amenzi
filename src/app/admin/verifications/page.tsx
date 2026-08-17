import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ADMIN_EMAIL } from "@/lib/constants";
import { VerificationsAdminBoard } from "@/components/admin/VerificationsAdminBoard";

export const metadata: Metadata = { title: "Cereri de verificare — Admin" };

export default async function AdminVerificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ request?: string }>;
}) {
  const { request } = await searchParams;
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) redirect("/login");
  if (auth.user.email !== ADMIN_EMAIL) redirect("/app/garage");

  const { data: requests } = await supabase
    .from("verification_requests")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  return <VerificationsAdminBoard initialRequests={requests ?? []} highlightId={request} />;
}
