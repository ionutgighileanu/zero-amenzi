import { createAdminClient } from "@/lib/supabase/admin";
import { sendAlertEmail } from "@/lib/email/send-alert";
import { NOTIFICATION_THRESHOLDS, EMAIL_DAILY_LIMIT } from "@/lib/constants";

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
  ownerId: string | null;
  orgId: string | null;
  plate: string;
};

type CandidateDriver = {
  kind: "driver";
  certId: string;
  driverId: string;
  docType: string;
  expiresAt: string;
  daysBefore: number;
  orgId: string;
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
      ownerId: v.owner_id,
      orgId: v.org_id,
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
      orgId: d.org_id,
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
          user_id: c.ownerId,
          org_id: c.orgId,
          vehicle_id: c.vehicleId,
          vehicle_doc_id: c.docId,
          doc_type: c.docType,
          days_before: c.daysBefore,
          expires_at: c.expiresAt,
          channel: "in_app" as const,
        }
      : {
          user_id: null,
          org_id: c.orgId,
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

  // Destinatar: personal → users.email (owner_id); flotă → email-ul owner-ului firmei.
  const orgIds = [...new Set(fresh.filter((c) => c.orgId).map((c) => c.orgId as string))];
  const { data: orgRows } = orgIds.length
    ? await supabase.from("organizations").select("id, owner_id").in("id", orgIds)
    : { data: [] };
  const orgOwnerByOrg = new Map((orgRows ?? []).map((o) => [o.id, o.owner_id]));

  function recipientUserId(c: Candidate): string | null {
    if (c.kind === "vehicle" && c.ownerId) return c.ownerId;
    if (c.orgId) return orgOwnerByOrg.get(c.orgId) ?? null;
    return null;
  }

  const recipientIds = [...new Set(fresh.map(recipientUserId).filter((id): id is string => !!id))];
  const { data: userRows } = recipientIds.length
    ? await supabase.from("users").select("id, email").in("id", recipientIds)
    : { data: [] };
  const emailByUserId = new Map((userRows ?? []).map((u) => [u.id, u.email]));

  for (let i = 0; i < fresh.length; i++) {
    const c = fresh[i];
    const insertedRow = inserted[i];
    const to = emailByUserId.get(recipientUserId(c) ?? "");
    if (!to) continue;

    if (emailBudget <= 0) {
      emailsSkippedCap++;
      continue;
    }

    const subjectLabel = c.kind === "vehicle" ? c.plate : c.driverName;
    const href = c.orgId ? `${appUrl}/app/fleet/${c.orgId}` : `${appUrl}/app/garage`;

    const ok = await sendAlertEmail({
      to,
      docType: c.docType,
      subjectLabel,
      daysBefore: c.daysBefore,
      expiresAt: c.expiresAt,
      appUrl: href,
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

  return { candidates: candidates.length, notified: fresh.length, emailsSent, emailsSkippedCap };
}
