"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { dismissCookieNotice, isCookieNoticeDismissed } from "@/lib/cookieNotice";

/** Paginile pe care bannerul n-are ce căuta: ar acoperi exact documentul pe
 * care utilizatorul a venit să-l citească, iar una dintre ele e chiar ținta
 * linkului din banner. */
const HIDDEN_ON = ["/politica-confidentialitate", "/termeni"];

/**
 * Notificare despre cookie-uri funcționale.
 *
 * Nu e un banner de consimțământ cu opțiuni: aplicația folosește exclusiv
 * cookie-uri strict necesare (sesiunea de autentificare și intenția temporară
 * de firmă la signup), care sub GDPR cer informare, nu consimțământ prealabil.
 * Dacă se adaugă vreodată analytics sau alt cookie neesențial, ăsta trebuie
 * înlocuit cu un banner real, cu accept și refuz.
 */
export function CookieBanner() {
  const pathname = usePathname();
  // Derivat, nu ținut în stare: altfel ar trebui resetat printr-un setState
  // sincron în efect la fiecare navigare, ceea ce declanșează re-randări în
  // cascadă.
  const hiddenOnThisPage = HIDDEN_ON.includes(pathname);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (hiddenOnThisPage) return;
    // localStorage e indisponibil la SSR, deci starea inițială e „ascuns" și
    // decidem abia după montare — altfel primul render client ar diferi de
    // HTML-ul server-randat.
    if (isCookieNoticeDismissed()) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisible(true);
  }, [hiddenOnThisPage]);

  const dismiss = () => {
    dismissCookieNotice();
    setVisible(false);
  };

  if (hiddenOnThisPage || !visible) return null;

  return (
    <div
      role="region"
      aria-label="Notificare despre cookie-uri"
      className="fixed bottom-0 inset-x-0 z-50 border-t border-slate-200 bg-white/95 backdrop-blur-sm"
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <p className="flex-1 text-sm text-slate-600 leading-relaxed">
          Folosim cookie-uri funcționale pentru autentificare. Detalii în{" "}
          <Link
            href="/politica-confidentialitate"
            className="text-brand font-medium hover:underline"
          >
            politica de confidențialitate
          </Link>
          .
        </p>
        <Button size="sm" onClick={dismiss} className="shrink-0 w-full sm:w-auto">
          Am înțeles
        </Button>
      </div>
    </div>
  );
}
