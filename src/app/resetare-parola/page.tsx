import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { UpdatePasswordForm } from "@/components/auth/UpdatePasswordForm";

export const metadata: Metadata = {
  title: "Setează parola nouă — AutoDocs",
  description: "Alege o parolă nouă pentru contul tău AutoDocs.",
  robots: { index: false, follow: false },
};

export default async function ResetareParolaPage() {
  // Se ajunge aici cu o sesiune: fie cea de recuperare produsă de linkul din
  // email (schimbat pe sesiune în /auth/callback), fie una normală. Fără
  // sesiune, linkul a expirat sau pagina a fost deschisă direct — trimitem
  // omul să ceară un link nou.
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/recuperare-parola");

  return <UpdatePasswordForm />;
}
