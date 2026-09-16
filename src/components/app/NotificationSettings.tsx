"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/Switch";
import { isPushSupported, subscribePush, unsubscribePush } from "@/lib/push/browser";
import { updateEmailNotificationsAction } from "@/lib/actions/settings";

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

  const togglePush = async (next: boolean) => {
    setPushError(null);

    if (!next) {
      setPushEnabled(false);
      setPushBusy(true);
      await unsubscribePush();
      setPushBusy(false);
      return;
    }

    if (typeof Notification !== "undefined" && Notification.permission === "denied") {
      setPushError("Trebuie să activezi notificările din setările browserului.");
      return;
    }

    setPushBusy(true);
    const ok = await subscribePush();
    setPushBusy(false);

    if (ok) {
      setPushEnabled(true);
    } else if (typeof Notification !== "undefined" && Notification.permission === "denied") {
      setPushError("Trebuie să activezi notificările din setările browserului.");
    } else {
      setPushError("Nu am putut activa notificările. Încearcă din nou.");
    }
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
            disabled={!supported || pushBusy}
            label="Alerte push"
          />
        </div>
        {pushError && <p className="text-xs text-red-600 mt-2">{pushError}</p>}
      </div>
    </div>
  );
}
