"use client";

/**
 * Helper client-side pentru Web Push (D-013). Folosit de PushOnboarding
 * (activare din onboarding) și de NotificationSettings (toggle din
 * /app/settings). Nu atinge server-ul decât prin /api/push/subscribe și
 * /api/push/unsubscribe — sursa de adevăr pentru abonamente rămâne
 * push_subscriptions.
 */

/** Suportul pentru Web Push lipsește pe iOS Safari în afara unei PWA
 * instalate și pe browsere vechi — verificăm explicit înainte de orice UI. */
export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const base64Safe = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64Safe);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

/**
 * Cere permisiunea (dacă e "default"), creează un PushSubscription și îl
 * salvează pe server. Aruncă doar dacă lipsește cheia publică VAPID din
 * bundle (eroare de configurare, nu de utilizator) — orice alt eșec e
 * întors ca `false`, apelantul decide mesajul.
 */
export async function subscribePush(): Promise<boolean> {
  if (!isPushSupported()) return false;

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!publicKey) {
    console.error("NEXT_PUBLIC_VAPID_PUBLIC_KEY nesetat — nu pot activa push.");
    return false;
  }

  if (Notification.permission === "default") {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return false;
  }
  if (Notification.permission !== "granted") return false;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription =
      (await registration.pushManager.getSubscription()) ??
      (await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      }));

    const json = subscription.toJSON();
    if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return false;

    const res = await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        endpoint: json.endpoint,
        keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
      }),
    });
    return res.ok;
  } catch (err) {
    console.error("Abonarea la push a eșuat:", err);
    return false;
  }
}

/** Dezabonează browserul curent și șterge rândul din push_subscriptions. */
export async function unsubscribePush(): Promise<boolean> {
  if (!isPushSupported()) return false;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) return true;

    const endpoint = subscription.endpoint;
    await subscription.unsubscribe();

    const res = await fetch("/api/push/unsubscribe", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint }),
    });
    return res.ok;
  } catch (err) {
    console.error("Dezabonarea de la push a eșuat:", err);
    return false;
  }
}
