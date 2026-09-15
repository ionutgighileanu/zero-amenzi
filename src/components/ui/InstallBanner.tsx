"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { MOBILE_VIEWPORT_QUERY } from "@/lib/constants";

const DISMISS_KEY = "za-install-banner-dismissed";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

/**
 * Banner discret de instalare PWA — apare doar dacă browser-ul chiar
 * suportă instalare (`beforeinstallprompt`, absent pe iOS Safari) și doar
 * dacă utilizatorul n-a respins-o deja (persistat în localStorage).
 * Montat explicit pe landing și în layout-ul /app — nu global, ca să nu
 * apară în mijlocul unui flow (login, signup, verificare).
 *
 * Doar pe mobile (vezi D-017): acolo instalarea pune iconița pe home screen,
 * comportament util și așteptat. Pe desktop PWA deschide o fereastră fără
 * browser chrome, care pentru majoritatea utilizatorilor pare un bug.
 */
export function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!window.matchMedia(MOBILE_VIEWPORT_QUERY).matches) return;
    if (localStorage.getItem(DISMISS_KEY)) return;

    const onBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
  }, []);

  const install = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setVisible(false);
  };

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Instalează aplicația"
      className="fixed bottom-4 inset-x-4 sm:inset-x-auto sm:right-4 sm:max-w-sm z-40 bg-white border border-slate-200 rounded-2xl shadow-lg p-4 flex items-start gap-3"
    >
      <p className="flex-1 text-sm text-slate-700">
        Instalează Zero Amenzi pe telefonul tău pentru acces rapid
      </p>
      <div className="flex items-center gap-2 shrink-0">
        <Button size="sm" onClick={install}>
          Instalează
        </Button>
        <button
          onClick={dismiss}
          aria-label="Închide"
          className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
