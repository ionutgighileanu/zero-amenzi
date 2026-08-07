import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/supabase/database.types";

/**
 * Client Supabase pentru Server Components, Server Actions și Route Handlers.
 * Citește sesiunea din cookies; folosește cheia anon — respectă RLS.
 *
 * Scrierea cookie-urilor poate arunca eroare când e chemat dintr-un Server
 * Component (Next.js nu permite set-cookie acolo); middleware.ts reîmprospătează
 * sesiunea la fiecare request, așa că ignorăm eroarea în siguranță.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Apelat dintr-un Server Component — middleware.ts se ocupă de refresh.
          }
        },
      },
    }
  );
}
