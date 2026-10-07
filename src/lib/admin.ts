import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/**
 * Rolul de admin, într-un singur loc (D-032).
 *
 * Citit din `app_metadata`, pe care îl poate scrie doar serverul (service_role)
 * — utilizatorul nu și-l poate modifica din browser, spre deosebire de
 * `user_metadata`. Înainte, admin era „cine are emailul X", deci orice cont
 * care ajungea să aibă adresa aceea devenea admin. Același rol îl verifică și
 * policy-urile din DB, prin `public.is_app_admin()`.
 */
export function isAdmin(user: Pick<User, "app_metadata"> | null | undefined): boolean {
  return user?.app_metadata?.role === "admin";
}

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
  if (!isAdmin(auth.user)) redirect("/app/garage");

  return { supabase, user: auth.user };
}
