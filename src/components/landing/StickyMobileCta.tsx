"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import {
  COOKIE_NOTICE_EVENT,
  isCookieNoticeDismissed,
} from "@/lib/cookieNotice";

/**
 * CTA fix în partea de jos, doar pe mobil, doar pe landing.
 *
 * Apare când formularul din hero a ieșit din ecran și dispare când redevine
 * vizibil — altfel ar dubla inutil un buton pe care utilizatorul îl are deja
 * în față. Click-ul derulează înapoi la formular și îi dă focus, ca omul să
 * poată tasta direct, fără un al doilea tap.
 *
 * Nu se afișează cât timp notificarea despre cookie-uri e încă pe ecran:
 * ambele stau jos, iar două bare suprapuse pe un telefon sunt mai rele decât
 * lipsa CTA-ului. Reapare imediat ce bannerul e închis.
 */
export function StickyMobileCta({ targetId }: { targetId: string }) {
  const [heroVisible, setHeroVisible] = useState(true);
  const [cookieNoticeUp, setCookieNoticeUp] = useState(true);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCookieNoticeUp(!isCookieNoticeDismissed());
    const onDismiss = () => setCookieNoticeUp(false);
    window.addEventListener(COOKIE_NOTICE_EVENT, onDismiss);
    return () => window.removeEventListener(COOKIE_NOTICE_EVENT, onDismiss);
  }, []);

  useEffect(() => {
    const target = document.getElementById(targetId);
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => setHeroVisible(entry.isIntersecting),
      // Un prag mic, ca bara să apară abia după ce formularul chiar a ieșit
      // din cadru, nu la primul pixel.
      { threshold: 0.1 }
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [targetId]);

  const scrollToForm = () => {
    const target = document.getElementById(targetId);
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "center" });
    // Focus pe input după derulare, ca tastatura să se deschidă direct.
    target.querySelector("input")?.focus({ preventScroll: true });
  };

  if (heroVisible || cookieNoticeUp) return null;

  return (
    <div className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur-sm px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <button
        type="button"
        onClick={scrollToForm}
        className="w-full min-h-12 inline-flex items-center justify-center gap-2 rounded-xl bg-brand text-white font-semibold text-base transition-opacity hover:opacity-90 active:scale-[0.98] motion-reduce:active:scale-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-700"
      >
        <Search size={18} aria-hidden="true" />
        Verifică actele gratuit
      </button>
    </div>
  );
}
