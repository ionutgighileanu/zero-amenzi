"use client";

import { useEffect, useState } from "react";
import { BellRing, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { isPushSupported, subscribePush } from "@/lib/push";

const SHOWN_KEY = "push_onboarding_shown";
const SNOOZE_MS = 7 * 24 * 60 * 60 * 1000;
const MOBILE_QUERY = "(max-width: 768px)";

/**
 * Card discret (nu modal) care apare o singură dată — după primul login,
 * dacă browser-ul suportă push și permisiunea e încă "default". „Mai
 * târziu" amână reapariția 7 zile; activarea (indiferent de rezultat) sau
 * refuzul explicit din browser opresc reapariția pentru totdeauna (vezi
 * verificarea Notification.permission la montare).
 *
 * Doar pe mobile (vezi D-017): pe desktop notificarea apare pe un monitor de
 * care utilizatorul poate fi departe, deci e un canal cu conversie mică și
 * fricțiune mare. Email + clopoțelul in-app acoperă desktop-ul.
 */
export function PushOnboarding() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!window.matchMedia(MOBILE_QUERY).matches) return;
    if (!isPushSupported()) return;
    if (Notification.permission !== "default") return;

    const shownAt = Number(localStorage.getItem(SHOWN_KEY) ?? 0);
    if (shownAt && Date.now() - shownAt < SNOOZE_MS) return;

    // Citește localStorage/Notification.permission — indisponibile la SSR,
    // deci starea inițială trebuie să fie "ascuns" și abia după montare
    // decidem să arătăm cardul. Fără efect aici, primul render client ar
    // diferi de HTML-ul server- randat (mismatch la hidratare).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisible(true);
  }, []);

  const dismiss = () => {
    localStorage.setItem(SHOWN_KEY, String(Date.now()));
    setVisible(false);
  };

  const activate = async () => {
    dismiss();
    await subscribePush();
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Activează notificările"
      className="fixed bottom-4 inset-x-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-sm z-40 bg-white border border-slate-200 rounded-2xl shadow-lg p-5"
    >
      <div className="flex items-start gap-3">
        <span className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
          <BellRing size={17} className="text-brand" />
        </span>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-bold text-slate-900 font-display">
            Primește alerte direct pe telefon
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Zero Amenzi te alertează înainte să expire actele. Activează notificările
            ca să primești alerte chiar dacă nu ai aplicația deschisă.
          </p>
        </div>
        <button
          onClick={dismiss}
          aria-label="Închide"
          className="p-1.5 -m-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 shrink-0"
        >
          <X size={16} />
        </button>
      </div>
      <div className="flex items-center gap-2 mt-4">
        <Button size="sm" onClick={activate} className="flex-1">
          Activează notificările
        </Button>
        <Button size="sm" variant="ghost" onClick={dismiss}>
          Mai târziu
        </Button>
      </div>
    </div>
  );
}
