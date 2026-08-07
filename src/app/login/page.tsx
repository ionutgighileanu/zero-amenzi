import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AuthForm } from "@/components/auth/AuthForm";

export const metadata: Metadata = {
  title: "Conectare — AutoDocs",
};

export default async function LoginPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (data.user) redirect("/app/garage");

  return (
    <Suspense>
      <AuthForm mode="login" />
    </Suspense>
  );
}
