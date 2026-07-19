import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/AuthForm";

export const metadata: Metadata = {
  title: "Conectare — AutoDocs",
};

export default function LoginPage() {
  return <AuthForm mode="login" />;
}
