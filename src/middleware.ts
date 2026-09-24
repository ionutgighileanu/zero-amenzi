import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Rulează pe toate rutele, cu excepția fișierelor statice și a rutelor de
     * cron (autentificate prin CRON_SECRET, nu prin sesiune — n-au nevoie de
     * cookie-uri Supabase, iar Vercel Cron nu trimite niciuna).
     *
     * api/csp-report e exclus din același motiv: browserul trimite rapoartele
     * fără cookie-uri, deci un refresh de sesiune acolo e muncă degeaba pe un
     * endpoint public care poate primi rafale de cereri.
     *
     * Lista de extensii e largă deliberat: fiecare cerere care ajunge aici
     * face un `getUser()` către Supabase, adică un drum în rețea. Înainte,
     * lista acoperea doar imagini, deci sw.js, manifest.json, robots.txt,
     * llms.txt, sitemap.xml și offline.html plăteau un apel de autentificare
     * degeaba — sw.js și manifest.json la fiecare încărcare de PWA, iar
     * robots/sitemap la fiecare trecere a unui crawler.
     */
    "/((?!_next/static|_next/image|api/cron|api/csp-report|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|json|webmanifest|js|css|html|woff2?)$).*)",
  ],
};
