import { getWebPushClient } from "@/lib/push/client";

export type PushSubscriptionKeys = { endpoint: string; p256dh: string; auth: string };

export type PushAlertParams = {
  subscription: PushSubscriptionKeys;
  docType: string;
  subjectLabel: string;
  daysBefore: number;
  url: string;
  notificationId: string;
};

export type SendPushResult = {
  ok: boolean;
  /** true dacă abonamentul nu mai e valid (410 Gone / 404) — apelantul
   * trebuie să șteargă rândul din push_subscriptions. */
  gone: boolean;
};

/**
 * Trimite o notificare Web Push pentru o alertă de expirare. Nu aruncă
 * niciodată: o eroare de livrare nu trebuie să blocheze restul cron-ului,
 * la fel ca la email (vezi send-alert.ts din lib/email).
 */
export async function sendPushAlert(params: PushAlertParams): Promise<SendPushResult> {
  const client = getWebPushClient();
  if (!client) {
    console.warn("VAPID keys nesetate — push-ul de alertă nu a fost trimis.");
    return { ok: false, gone: false };
  }

  const timeframe =
    params.daysBefore === 0
      ? "expiră azi"
      : `expiră în ${params.daysBefore} ${params.daysBefore === 1 ? "zi" : "zile"}`;

  const payload = JSON.stringify({
    title: "Zero Amenzi",
    body: `${params.docType} ${timeframe} pentru ${params.subjectLabel}`,
    url: params.url,
    notificationId: params.notificationId,
  });

  try {
    await client.sendNotification(
      {
        endpoint: params.subscription.endpoint,
        keys: { p256dh: params.subscription.p256dh, auth: params.subscription.auth },
      },
      payload
    );
    return { ok: true, gone: false };
  } catch (err) {
    // web-push aruncă WebPushError cu statusCode — 404/410 înseamnă că
    // browserul a revocat abonamentul (dezinstalare, curățare cache etc.).
    const statusCode = (err as { statusCode?: number }).statusCode;
    const gone = statusCode === 404 || statusCode === 410;
    if (!gone) console.error("Trimiterea push-ului a eșuat:", err);
    return { ok: false, gone };
  }
}
