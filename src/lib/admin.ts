import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ADMIN_EMAIL } from "@/lib/constants";

/**
 * Garda paginilor de admin, într-un singur loc.
 *
 * Contează pentru că paginile de admin citesc cu service_role, care ocolește
 * complet RLS: o singură verificare uitată sau scrisă greșit ar expune toată
 * baza de date. Înainte, verificarea era copiată în fiecare pagină.
 */
export async function requireAdmin() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) redirect("/login");
  if (auth.user.email !== ADMIN_EMAIL) redirect("/app/garage");

  return { supabase, user: auth.user };
}
