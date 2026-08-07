import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AuthForm } from "@/components/auth/AuthForm";

export const metadata: Metadata = {
  title: "Creează cont — AutoDocs",
};

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ tip?: string }>;
}) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (data.user) redirect("/app/garage");

  const { tip } = await searchParams;
  return (
    <Suspense>
      <AuthForm mode="signup" defaultAccount={tip === "firma" ? "B2B" : "B2C"} />
    </Suspense>
  );
}
