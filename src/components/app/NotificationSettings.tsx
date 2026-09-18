"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/Switch";
import {
  isPushSupported,
  subscribePush,
  unsubscribePush,
  type PushFailureReason,
} from "@/lib/push/browser";
import { updateEmailNotificationsAction } from "@/lib/actions/settings";

/** Fiecare motiv cere altă acțiune de la utilizator — de-aia nu mai există
 * un singur mesaj generic. Vezi PushFailureReason în src/lib/push/browser.ts. */
const PUSH_ERROR_MESSAGES: Record<PushFailureReason, string> = {
  unsupported: "Browserul tău nu suportă notificări push.",
  "not-configured": "Notificările push nu sunt configurate pe server.",
  "permission-denied": "Browser-ul blochează notificările. Verifică setările site-ului.",
  "sw-unavailable":
    "Aplicația nu e încă pregătită pentru notificări. Reîncarcă pagina și încearcă din nou.",
  "push-service-failed": "Nu am putut activa notificările. Încearcă din nou.",
  "endpoint-rejected": "Serviciul de notificări al browserului tău nu e acceptat.",
  unauthorized: "Sesiunea a expirat. Autentifică-te din nou.",
  network: "Conexiunea s-a întrerupt. Verifică internetul și încearcă din nou.",
  server: "Nu am putut salva setarea. Încearcă din nou.",
};

type NotificationSettingsProps = {
  initialEmailEnabled: boolean;
  initialPushEnabled: boolean;
};

export function NotificationSettings({
  initialEmailEnabled,
  initialPushEnabled,
}: NotificationSettingsProps) {
  const [emailEnabled, setEmailEnabled] = useState(initialEmailEnabled);
  const [pushEnabled, setPushEnabled] = useState(initialPushEnabled);
  const [pushBusy, setPushBusy] = useState(false);
  const [pushError, setPushError] = useState<string | null>(null);

  const supported = isPushSupported();

  const toggleEmail = (next: boolean) => {
    setEmailEnabled(next);
    updateEmailNotificationsAction(next).catch((err) => {
      console.error(err);
      setEmailEnabled(!next); // revine la starea anterioară dacă salvarea eșuează
    });
  };

  /**
   * Optimistic: slider-ul se mută instant, lanțul real rulează în fundal.
   *
   * Înainte, comutatorul aștepta tot flow-ul — permisiune, apoi
   * `pushManager.subscribe()` (0,5–2 s de negociere VAPID), apoi POST — și
   * abia la final se mișca. Pe mobil asta se simțea ca un buton mort.
   *
   * Nu e `async` și nu are `await` înaintea apelului: `requestPermission()`
   * are nevoie de gestul utilizatorului încă „proaspăt", iar un await
   * intermediar l-ar consuma și promptul n-ar mai apărea.
   */
  const togglePush = (next: boolean) => {
    setPushError(null);
    setPushEnabled(next);
    setPushBusy(true);

    const operation = next ? subscribePush() : unsubscribePush();

    operation
      .then((result) => {
        if (result.ok) return;
        setPushEnabled(!next); // rollback: starea reală n-a fost atinsă
        setPushError(PUSH_ERROR_MESSAGES[result.reason]);
      })
      .catch((err) => {
        console.error("[push] eroare neprevăzută la comutare:", err);
        setPushEnabled(!next);
        setPushError(PUSH_ERROR_MESSAGES["push-service-failed"]);
      })
      .finally(() => setPushBusy(false));
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100">
      <div className="flex items-start justify-between gap-4 p-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-800">În aplicație</p>
          <p className="text-xs text-slate-500 mt-0.5">
            Alertele în aplicație nu pot fi dezactivate.
          </p>
        </div>
        <input
          type="checkbox"
          checked
          disabled
          aria-label="În aplicație (mereu activ)"
          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand accent-brand shrink-0"
        />
      </div>

      <div className="flex items-start justify-between gap-4 p-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-800">Email</p>
          <p className="text-xs text-slate-500 mt-0.5">
            Primești un email când un document e aproape de expirare.
          </p>
        </div>
        <Switch checked={emailEnabled} onChange={toggleEmail} label="Alerte pe email" />
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-800">Push notifications</p>
            <p className="text-xs text-slate-500 mt-0.5">
              {supported
                ? "Primești o notificare pe telefon chiar dacă aplicația e închisă."
                : "Browser-ul tău nu suportă notificări push."}
            </p>
          </div>
          <Switch
            checked={pushEnabled}
            onChange={togglePush}
            disabled={!supported}
            busy={pushBusy}
            label="Alerte push"
          />
        </div>
        {pushError && (
          <p className="text-xs text-red-600 mt-2" role="alert">
            {pushError}
          </p>
        )}
      </div>
    </div>
  );
}
