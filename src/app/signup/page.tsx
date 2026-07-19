import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/AuthForm";

export const metadata: Metadata = {
  title: "Creează cont — AutoDocs",
};

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ tip?: string }>;
}) {
  const { tip } = await searchParams;
  return <AuthForm mode="signup" defaultAccount={tip === "firma" ? "B2B" : "B2C"} />;
}
