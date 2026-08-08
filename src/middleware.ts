import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Rulează pe toate rutele, cu excepția fișierelor statice/de imagine și
     * a rutelor de cron (autentificate prin CRON_SECRET, nu prin sesiune —
     * n-au nevoie de cookie-uri Supabase, iar Vercel Cron nu trimite niciuna).
     */
    "/((?!_next/static|_next/image|favicon.ico|api/cron|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
