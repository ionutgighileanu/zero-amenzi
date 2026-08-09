import { BRAND_BLUE } from "@/lib/constants";
import { getResendClient } from "@/lib/email/client";

export type AlertEmailParams = {
  to: string;
  docType: string;
  subjectLabel: string;
  daysBefore: number;
  expiresAt: string;
  appUrl: string;
};

function formatRo(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("ro-RO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function buildHtml(params: AlertEmailParams): string {
  const { docType, subjectLabel, daysBefore, expiresAt, appUrl } = params;
  const timeframe =
    daysBefore === 0
      ? "expiră azi"
      : `expiră în ${daysBefore} ${daysBefore === 1 ? "zi" : "zile"}`;

  return `
<!doctype html>
<html lang="ro">
  <body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
            <tr>
              <td style="padding:24px 28px;border-bottom:1px solid #f1f5f9;">
                <span style="font-size:18px;font-weight:800;color:${BRAND_BLUE};letter-spacing:-0.02em;">Zero Amenzi</span>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;">
                <p style="margin:0 0 6px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.04em;color:#64748b;">
                  ${docType}
                </p>
                <h1 style="margin:0 0 16px;font-size:20px;line-height:1.4;color:#0f172a;">
                  ${subjectLabel} — ${timeframe}
                </h1>
                <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#475569;">
                  Data expirării: <strong>${formatRo(expiresAt)}</strong>.
                  Reînnoiește din timp ca să nu rămâi fără documente valabile.
                </p>
                <a href="${appUrl}" style="display:inline-block;background:${BRAND_BLUE};color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 20px;border-radius:10px;">
                  Vezi în aplicație
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`.trim();
}

/**
 * Trimite alerta prin Resend, folosind domeniul de test onboarding@resend.dev
 * (fără verificare de domeniu propriu — suficient pentru volumul actual).
 * Nu aruncă niciodată: o eroare de livrare nu trebuie să blocheze scrierea
 * notificării in-app, care rămâne sursa de adevăr indiferent de email.
 */
export async function sendAlertEmail(params: AlertEmailParams): Promise<boolean> {
  const resend = getResendClient();
  if (!resend) {
    console.warn("RESEND_API_KEY nesetat — email-ul de alertă nu a fost trimis.");
    return false;
  }

  try {
    const { error } = await resend.emails.send({
      from: "Zero Amenzi <onboarding@resend.dev>",
      to: params.to,
      subject:
        params.daysBefore === 0
          ? `${params.docType} expiră azi — ${params.subjectLabel}`
          : `${params.docType} expiră în ${params.daysBefore} ${params.daysBefore === 1 ? "zi" : "zile"} — ${params.subjectLabel}`,
      html: buildHtml(params),
    });
    if (error) {
      console.error("Resend a refuzat email-ul:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Trimiterea email-ului a eșuat:", err);
    return false;
  }
}
