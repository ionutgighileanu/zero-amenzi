import { BRAND_BLUE } from "@/lib/constants";
import { getResendClient } from "@/lib/email/client";
import { describeResult, type ResultTone } from "@/lib/verification";
import type { VerificationResultValue } from "@/lib/constants";

export type VerificationResultEmailParams = {
  to: string;
  plate: string;
  requestId: string;
  appUrl: string;
  itp: VerificationResultValue | null;
  rca: VerificationResultValue | null;
  rovinieta: VerificationResultValue | null;
  itpExpires: string | null;
  rcaExpires: string | null;
  rovinietaExpires: string | null;
};

const TONE_COLOR: Record<ResultTone, string> = {
  valid: "#059669",
  warning: "#b45309",
  expired: "#dc2626",
  none: "#64748b",
};

function row(label: string, tone: ResultTone, text: string): string {
  return `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;">
        <span style="font-size:13px;font-weight:700;color:#0f172a;">${label}</span><br/>
        <span style="font-size:13px;font-weight:600;color:${TONE_COLOR[tone]};">${text}</span>
      </td>
    </tr>`;
}

function buildHtml(params: VerificationResultEmailParams): string {
  const resultPageUrl = `${params.appUrl}/verificare/status/${params.requestId}`;
  const signupUrl = `${params.appUrl}/signup`;

  const itp = describeResult(params.itp, params.itpExpires);
  const rca = describeResult(params.rca, params.rcaExpires);
  const rovinieta = describeResult(params.rovinieta, params.rovinietaExpires);

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
                <p style="margin:0 0 4px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.04em;color:#64748b;">
                  Rezultatul verificării
                </p>
                <h1 style="margin:0 0 20px;font-size:22px;letter-spacing:0.04em;color:#0f172a;">
                  ${params.plate}
                </h1>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  ${row("ITP", itp.tone, itp.text)}
                  ${row("RCA", rca.tone, rca.text)}
                  ${row("Rovinietă", rovinieta.tone, rovinieta.text)}
                </table>
                <div style="margin-top:24px;display:flex;gap:10px;">
                  <a href="${signupUrl}" style="display:inline-block;background:${BRAND_BLUE};color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 20px;border-radius:10px;margin-right:10px;">
                    Creează cont gratuit
                  </a>
                </div>
                <p style="margin:16px 0 0;font-size:12px;color:#94a3b8;">
                  Sau <a href="${resultPageUrl}" style="color:${BRAND_BLUE};">vezi rezultatul complet în pagina de status</a>.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`.trim();
}

/** Trimis de admin la finalul completării unei cereri de verificare (dacă
 * solicitantul a lăsat un email). Eșec grațios — rezultatul rămâne salvat
 * și vizibil la /verificare/status/[id] indiferent dacă email-ul pleacă sau nu. */
export async function sendVerificationResultEmail(
  params: VerificationResultEmailParams
): Promise<boolean> {
  const resend = getResendClient();
  if (!resend) {
    console.warn("RESEND_API_KEY nesetat — email-ul de rezultat nu a fost trimis.");
    return false;
  }

  try {
    const { error } = await resend.emails.send({
      from: "Zero Amenzi <onboarding@resend.dev>",
      to: params.to,
      subject: `Rezultatul verificării pentru ${params.plate}`,
      html: buildHtml(params),
    });
    if (error) {
      console.error("Resend a refuzat email-ul de rezultat:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Trimiterea email-ului de rezultat a eșuat:", err);
    return false;
  }
}
