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
 * Motivul concret al eșecului. Înainte, totul se întorcea ca `false`, iar
 * UI-ul putea spune doar „Nu am putut activa notificările" — inutil, fiindcă
 * un browser care blochează permisiunea și o rețea picată cer acțiuni
 * complet diferite de la utilizator.
 */
export type PushFailureReason =
  | "unsupported"
  | "not-configured"
  | "permission-denied"
  | "sw-unavailable"
  | "push-service-failed"
  | "endpoint-rejected"
  | "unauthorized"
  | "network"
  | "server";

export type PushResult = { ok: true } | { ok: false; reason: PushFailureReason };

const fail = (reason: PushFailureReason): PushResult => ({ ok: false, reason });

const SW_READY_TIMEOUT_MS = 10_000;

/**
 * `navigator.serviceWorker.ready` NU se rejectează niciodată: dacă nu există
 * niciun service worker înregistrat, promisiunea așteaptă la infinit. În dev
 * SW-ul e dezactivat complet (vezi `disable` în next.config.ts), iar în
 * producție poate fi încă neactivat la prima încărcare a paginii. Fără
 * plafonul de aici, toggle-ul rămânea agățat pentru totdeauna, fără eroare
 * și fără cale de ieșire.
 */
async function readyRegistration(): Promise<ServiceWorkerRegistration | null> {
  return Promise.race([
    navigator.serviceWorker.ready,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), SW_READY_TIMEOUT_MS)),
  ]);
}

/**
 * Cere permisiunea (dacă e "default"), creează un PushSubscription și îl
 * salvează pe server.
 *
 * ATENȚIE la apelant: `Notification.requestPermission()` are nevoie de gestul
 * utilizatorului încă „proaspăt", deci funcția trebuie chemată direct din
 * handlerul de click, fără `await` înaintea ei.
 */
export async function subscribePush(): Promise<PushResult> {
  if (!isPushSupported()) return fail("unsupported");

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!publicKey) {
    console.error("[push] NEXT_PUBLIC_VAPID_PUBLIC_KEY nesetat în bundle — push indisponibil.");
    return fail("not-configured");
  }

  if (Notification.permission === "default") {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return fail("permission-denied");
  }
  if (Notification.permission !== "granted") return fail("permission-denied");

  const registration = await readyRegistration();
  if (!registration) {
    console.error("[push] service workerul nu s-a activat în 10s — push indisponibil.");
    return fail("sw-unavailable");
  }

  // Pasul lent (0,5–2 s): browserul negociază cu serviciul de push folosind
  // cheia VAPID. Nu poate fi grăbit, de-aia UI-ul nu trebuie să-l aștepte.
  let subscription: PushSubscription;
  try {
    subscription =
      (await registration.pushManager.getSubscription()) ??
      (await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      }));
  } catch (err) {
    console.error("[push] pushManager.subscribe a eșuat:", err);
    return fail("push-service-failed");
  }

  const json = subscription.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
    console.error("[push] PushSubscription incomplet, lipsesc endpoint sau cheile.");
    return fail("push-service-failed");
  }

  let res: Response;
  try {
    res = await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        endpoint: json.endpoint,
        keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
      }),
    });
  } catch (err) {
    console.error("[push] salvarea abonamentului a eșuat la rețea:", err);
    return fail("network");
  }

  if (res.ok) return { ok: true };

  const body = await res.json().catch(() => null);
  console.error("[push] serverul a respins abonamentul:", res.status, body);

  // invalid_endpoint = allow-list de host din src/lib/push/allowed-endpoints.ts
  if (body?.error === "invalid_endpoint") return fail("endpoint-rejected");
  if (res.status === 401) return fail("unauthorized");
  return fail("server");
}

/** Dezabonează browserul curent și șterge rândul din push_subscriptions. */
export async function unsubscribePush(): Promise<PushResult> {
  if (!isPushSupported()) return fail("unsupported");

  const registration = await readyRegistration();
  if (!registration) {
    console.error("[push] service workerul nu s-a activat în 10s — nu pot dezabona.");
    return fail("sw-unavailable");
  }

  let subscription: PushSubscription | null;
  try {
    subscription = await registration.pushManager.getSubscription();
  } catch (err) {
    console.error("[push] citirea abonamentului a eșuat:", err);
    return fail("push-service-failed");
  }

  // Nimic de dezabonat înseamnă că starea dorită e deja atinsă.
  if (!subscription) return { ok: true };

  const endpoint = subscription.endpoint;
  try {
    await subscription.unsubscribe();
  } catch (err) {
    console.error("[push] unsubscribe a eșuat:", err);
    return fail("push-service-failed");
  }

  try {
    const res = await fetch("/api/push/unsubscribe", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint }),
    });
    if (!res.ok) {
      console.error("[push] ștergerea abonamentului a eșuat:", res.status);
      return res.status === 401 ? fail("unauthorized") : fail("server");
    }
  } catch (err) {
    console.error("[push] ștergerea abonamentului a eșuat la rețea:", err);
    return fail("network");
  }

  return { ok: true };
}
