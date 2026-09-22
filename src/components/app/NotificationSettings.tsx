"use client";

import { useState, useSyncExternalStore } from "react";
import { Switch } from "@/components/ui/Switch";
import { MOBILE_VIEWPORT_QUERY } from "@/lib/constants";
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

type PushEnvironment = {
  supported: boolean;
  mobile: boolean;
  permission: NotificationPermission | "unsupported";
};

/**
 * Starea browserului relevantă pentru push, citită doar pe client.
 *
 * `useSyncExternalStore` cu snapshot de server separat: pe server nu există
 * `window`, iar un calcul direct la randare producea alt text pe server decât
 * în browser (mismatch la hidratare). Snapshot-ul e un șir, ca React să-l
 * poată compara stabil între randări.
 */
function subscribeToViewport(onChange: () => void) {
  const query = window.matchMedia(MOBILE_VIEWPORT_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function readPushEnvironment(): string {
  const supported = isPushSupported();
  const mobile = window.matchMedia(MOBILE_VIEWPORT_QUERY).matches;
  const permission = supported ? Notification.permission : "unsupported";
  return `${supported ? 1 : 0}|${mobile ? 1 : 0}|${permission}`;
}

function usePushEnvironment(): PushEnvironment | null {
  const snapshot = useSyncExternalStore(subscribeToViewport, readPushEnvironment, () => "");
  if (!snapshot) return null;
  const [supported, mobile, permission] = snapshot.split("|");
  return {
    supported: supported === "1",
    mobile: mobile === "1",
    permission: permission as PushEnvironment["permission"],
  };
}

export function NotificationSettings({
  initialEmailEnabled,
  initialPushEnabled,
}: NotificationSettingsProps) {
  const [emailEnabled, setEmailEnabled] = useState(initialEmailEnabled);
  const [pushEnabled, setPushEnabled] = useState(initialPushEnabled);
  const [pushBusy, setPushBusy] = useState(false);
  const [pushError, setPushError] = useState<string | null>(null);

  const env = usePushEnvironment();

  // Push e oferit doar pe mobil (D-017). Pe desktop comutatorul dispare —
  // excepție: dacă abonamentul există deja, rămâne ca să poată fi oprit.
  const desktopOnly = env !== null && env.supported && !env.mobile && !pushEnabled;
  // Blocat din browser: se vede la încărcare, nu abia după un click eșuat.
  const blockedByBrowser = env?.permission === "denied" && !pushEnabled;
  const showPushSwitch = !desktopOnly;
  const pushTogglable = env !== null && env.supported && !blockedByBrowser;

  const pushDescription =
    env === null
      ? "Primești o notificare pe telefon chiar dacă aplicația e închisă."
      : !env.supported
        ? "Browserul tău nu suportă notificări push."
        : desktopOnly
          ? "Disponibile pe telefon: deschide Zero Amenzi de pe telefon ca să le activezi."
          : blockedByBrowser
            ? "Browserul blochează notificările pentru acest site. Le poți debloca din setările site-ului."
            : "Primești o notificare pe telefon chiar dacă aplicația e închisă.";

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
            <p className="text-xs text-slate-500 mt-0.5">{pushDescription}</p>
          </div>
          {showPushSwitch && (
            <Switch
              checked={pushEnabled}
              onChange={togglePush}
              disabled={!pushTogglable}
              busy={pushBusy}
              label="Alerte push"
            />
          )}
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
