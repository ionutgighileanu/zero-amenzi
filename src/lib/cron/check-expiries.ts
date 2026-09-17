import { createAdminClient } from "@/lib/supabase/admin";
import { mapSpaceRow, spacePath } from "@/lib/spaces";
import { sendAlertEmail } from "@/lib/email/send-alert";
import { sendPushAlert } from "@/lib/push/send-alert";
import { NOTIFICATION_THRESHOLDS, EMAIL_DAILY_LIMIT } from "@/lib/constants";
import type { Database } from "@/lib/supabase/database.types";

type PushSubscriptionRow = Database["public"]["Tables"]["push_subscriptions"]["Row"];

function todayUTC(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function addDaysISO(base: Date, days: number): string {
  const d = new Date(base);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

type CandidateVehicle = {
  kind: "vehicle";
  docId: string;
  vehicleId: string;
  docType: string;
  expiresAt: string;
  daysBefore: number;
  spaceId: string;
  plate: string;
};

type CandidateDriver = {
  kind: "driver";
  certId: string;
  driverId: string;
  docType: string;
  expiresAt: string;
  daysBefore: number;
  spaceId: string;
  driverName: string;
};

type Candidate = CandidateVehicle | CandidateDriver;

export type CheckExpiriesResult = {
  candidates: number;
  notified: number;
  emailsSent: number;
  emailsSkippedCap: number;
};

/**
 * Rulează zilnic (Vercel Cron, 08:00 UTC — vezi vercel.json). Verifică
 * vehicle_docs și driver_certs care expiră exact la unul din pragurile
 * NOTIFICATION_THRESHOLDS (30/15/2/0 zile), scrie o notificare in-app pentru
 * fiecare alertă nouă (idempotent — verifică notifications_log înainte de
 * insert) și trimite un email prin Resend, respectând plafonul zilnic.
 */
export async function checkExpiries(): Promise<CheckExpiriesResult> {
  const supabase = createAdminClient();
  const today = todayUTC();
  const targetDates = NOTIFICATION_THRESHOLDS.map((days) => ({
    days,
    date: addDaysISO(today, days),
  }));
  const dateList = targetDates.map((t) => t.date);
  const daysByDate = new Map(targetDates.map((t) => [t.date, t.days]));

  // --- Documente de vehicul ------------------------------------------------
  const { data: docs } = await supabase.from("vehicle_docs").select("*").in("expires_at", dateList);

  const vehicleIds = [...new Set((docs ?? []).map((d) => d.vehicle_id))];
  const { data: vehicleRows } = vehicleIds.length
    ? await supabase.from("vehicles").select("*").in("id", vehicleIds).is("deleted_at", null)
    : { data: [] };
  const vehiclesById = new Map((vehicleRows ?? []).map((v) => [v.id, v]));

  const vehicleCandidates: CandidateVehicle[] = [];
  for (const doc of docs ?? []) {
    const v = vehiclesById.get(doc.vehicle_id);
    if (!v) continue; // vehicul șters sau inexistent — nu alertăm pe date orfane
    const daysBefore = daysByDate.get(doc.expires_at);
    if (daysBefore === undefined) continue;
    vehicleCandidates.push({
      kind: "vehicle",
      docId: doc.id,
      vehicleId: v.id,
      docType: doc.type,
      expiresAt: doc.expires_at,
      daysBefore,
      spaceId: v.space_id,
      plate: v.plate,
    });
  }

  // --- Atestate șofer --------------------------------------------------------
  const { data: certs } = await supabase.from("driver_certs").select("*").in("expires_at", dateList);

  const driverIds = [...new Set((certs ?? []).map((c) => c.driver_id))];
  const { data: driverRows } = driverIds.length
    ? await supabase.from("drivers").select("*").in("id", driverIds).is("deleted_at", null)
    : { data: [] };
  const driversById = new Map((driverRows ?? []).map((d) => [d.id, d]));

  const driverCandidates: CandidateDriver[] = [];
  for (const cert of certs ?? []) {
    const d = driversById.get(cert.driver_id);
    if (!d) continue;
    const daysBefore = daysByDate.get(cert.expires_at);
    if (daysBefore === undefined) continue;
    driverCandidates.push({
      kind: "driver",
      certId: cert.id,
      driverId: d.id,
      docType: cert.type,
      expiresAt: cert.expires_at,
      daysBefore,
      spaceId: d.space_id,
      driverName: d.name,
    });
  }

  const candidates: Candidate[] = [...vehicleCandidates, ...driverCandidates];
  if (candidates.length === 0) {
    return { candidates: 0, notified: 0, emailsSent: 0, emailsSkippedCap: 0 };
  }

  // --- Idempotență: ce a fost deja notificat pentru acest (document, prag) --
  const vehicleDocIds = vehicleCandidates.map((c) => c.docId);
  const driverCertIds = driverCandidates.map((c) => c.certId);
  const alreadyNotified = new Set<string>();

  if (vehicleDocIds.length) {
    const { data: existing } = await supabase
      .from("notifications_log")
      .select("vehicle_doc_id, days_before")
      .in("vehicle_doc_id", vehicleDocIds);
    for (const row of existing ?? []) alreadyNotified.add(`v:${row.vehicle_doc_id}:${row.days_before}`);
  }
  if (driverCertIds.length) {
    const { data: existing } = await supabase
      .from("notifications_log")
      .select("driver_cert_id, days_before")
      .in("driver_cert_id", driverCertIds);
    for (const row of existing ?? []) alreadyNotified.add(`d:${row.driver_cert_id}:${row.days_before}`);
  }

  const fresh = candidates.filter((c) => {
    const key = c.kind === "vehicle" ? `v:${c.docId}:${c.daysBefore}` : `d:${c.certId}:${c.daysBefore}`;
    return !alreadyNotified.has(key);
  });

  if (fresh.length === 0) {
    return { candidates: candidates.length, notified: 0, emailsSent: 0, emailsSkippedCap: 0 };
  }

  // --- Scrie notificările in-app ---------------------------------------------
  const rows = fresh.map((c) =>
    c.kind === "vehicle"
      ? {
          user_id: recipientUserId(c),
          space_id: c.spaceId,
          vehicle_id: c.vehicleId,
          vehicle_doc_id: c.docId,
          doc_type: c.docType,
          days_before: c.daysBefore,
          expires_at: c.expiresAt,
          channel: "in_app" as const,
        }
      : {
          user_id: recipientUserId(c),
          space_id: c.spaceId,
          driver_id: c.driverId,
          driver_cert_id: c.certId,
          doc_type: c.docType,
          days_before: c.daysBefore,
          expires_at: c.expiresAt,
          channel: "in_app" as const,
        }
  );

  const { data: inserted, error: insertError } = await supabase
    .from("notifications_log")
    .insert(rows)
    .select();

  if (insertError || !inserted) {
    console.error("Nu am putut scrie notifications_log:", insertError);
    return { candidates: candidates.length, notified: 0, emailsSent: 0, emailsSkippedCap: 0 };
  }

  // --- Email: destinatar + trimitere, cu plafon zilnic ------------------------
  const { count: emailsToday } = await supabase
    .from("notifications_log")
    .select("id", { count: "exact", head: true })
    .gte("email_sent_at", today.toISOString());

  let emailBudget = Math.max(0, EMAIL_DAILY_LIMIT - (emailsToday ?? 0));
  let emailsSent = 0;
  let emailsSkippedCap = 0;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  // Destinatarul e owner-ul spațiului — aceeași regulă pentru garaj personal
  // și pentru flotă, de când ambele sunt rânduri în `spaces` (D-019). Înainte
  // era o ramificație: owner_id direct la personal, lookup în organizations
  // la flotă.
  const spaceIds = [...new Set(fresh.map((c) => c.spaceId))];
  const { data: spaceRows } = spaceIds.length
    ? await supabase.from("spaces").select("*").in("id", spaceIds)
    : { data: [] };
  const ownerBySpace = new Map((spaceRows ?? []).map((sp) => [sp.id, sp.owner_id]));
  const pathBySpace = new Map(
    (spaceRows ?? []).map((sp) => [sp.id, spacePath(mapSpaceRow(sp))])
  );

  function recipientUserId(c: Candidate): string | null {
    return ownerBySpace.get(c.spaceId) ?? null;
  }

  const recipientIds = [...new Set(fresh.map(recipientUserId).filter((id): id is string => !!id))];
  const { data: userRows } = recipientIds.length
    ? await supabase.from("users").select("id, email, email_notifications").in("id", recipientIds)
    : { data: [] };
  const userById = new Map((userRows ?? []).map((u) => [u.id, u]));

  // Abonamente push active ale destinatarilor — interogate o singură dată,
  // reutilizate mai jos (un user poate avea mai multe, ex. telefon + laptop).
  const { data: subRows } = recipientIds.length
    ? await supabase.from("push_subscriptions").select("*").in("user_id", recipientIds)
    : { data: [] as PushSubscriptionRow[] };
  const subsByUserId = new Map<string, PushSubscriptionRow[]>();
  for (const s of subRows ?? []) {
    const list = subsByUserId.get(s.user_id) ?? [];
    list.push(s);
    subsByUserId.set(s.user_id, list);
  }

  for (let i = 0; i < fresh.length; i++) {
    const c = fresh[i];
    const insertedRow = inserted[i];
    const uid = recipientUserId(c);
    const recipient = uid ? userById.get(uid) : undefined;
    const subjectLabel = c.kind === "vehicle" ? c.plate : c.driverName;
    const path = pathBySpace.get(c.spaceId) ?? "/app/garage";

    // --- Email — respectă preferința users.email_notifications (D-013: ---
    // push e canal suplimentar, nu înlocuiește email-ul; dezactivarea e
    // explicită per user, nu implicită).
    if (recipient?.email && recipient.email_notifications) {
      if (emailBudget <= 0) {
        emailsSkippedCap++;
      } else {
        const ok = await sendAlertEmail({
          to: recipient.email,
          docType: c.docType,
          subjectLabel,
          daysBefore: c.daysBefore,
          expiresAt: c.expiresAt,
          appUrl: `${appUrl}${path}`,
        });
        emailBudget--;
        if (ok) {
          emailsSent++;
          await supabase
            .from("notifications_log")
            .update({ email_sent_at: new Date().toISOString() })
            .eq("id", insertedRow.id);
        }
      }
    }

    // --- Push — fără plafon (spre deosebire de email, Web Push e gratuit) ---
    const subs = uid ? (subsByUserId.get(uid) ?? []) : [];
    let anyPushSent = false;
    for (const sub of subs) {
      const result = await sendPushAlert({
        subscription: { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
        docType: c.docType,
        subjectLabel,
        daysBefore: c.daysBefore,
        url: path,
        notificationId: insertedRow.id,
      });
      if (result.ok) anyPushSent = true;
      if (result.gone) {
        await supabase.from("push_subscriptions").delete().eq("id", sub.id);
      }
    }
    if (anyPushSent) {
      await supabase
        .from("notifications_log")
        .update({ push_sent_at: new Date().toISOString() })
        .eq("id", insertedRow.id);
    }
  }

  return { candidates: candidates.length, notified: fresh.length, emailsSent, emailsSkippedCap };
}
