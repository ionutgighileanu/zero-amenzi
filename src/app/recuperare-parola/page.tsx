import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RequestPasswordResetForm } from "@/components/auth/RequestPasswordResetForm";

export const metadata: Metadata = {
  title: "Recuperare parolă — AutoDocs",
  description: "Primește un link de resetare a parolei pentru contul tău AutoDocs.",
  // Pagină de flux de cont, n-are ce căuta în indexul motoarelor de căutare.
  robots: { index: false, follow: false },
};

export default async function RecuperareParolaPage() {
  // Deja logat: n-are rost să ceară reset prin email, poate schimba parola
  // direct din sesiunea curentă pe /resetare-parola.
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (data.user) redirect("/resetare-parola");

  return <RequestPasswordResetForm />;
}
