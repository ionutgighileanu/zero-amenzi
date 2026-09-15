import { ADMIN_EMAIL, BRAND_BLUE } from "@/lib/constants";
import { getResendClient } from "@/lib/email/client";
import { escapeHtml } from "@/lib/email/escape";

export type NewVerificationRequestEmailParams = {
  requestId: string;
  plate: string;
  createdAt: string;
  appUrl: string;
};

function formatRoDateTime(iso: string): string {
  return new Date(iso).toLocaleString("ro-RO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function buildHtml(params: NewVerificationRequestEmailParams): string {
  // Link către /admin/verifications (nu /admin/vehicles/[id]) — o cerere
  // publică nu e neapărat legată de un vehicul înregistrat: verification_requests
  // n-are vehicle_id, doar un plate_number introdus de un vizitator anonim.
  // ?request= deschide direct modalul cererii în panoul admin.
  const adminUrl = `${params.appUrl}/admin/verifications?request=${params.requestId}`;

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
                  Cerere de verificare nouă
                </p>
                <h1 style="margin:0 0 20px;font-size:22px;letter-spacing:0.04em;color:#0f172a;">
                  ${escapeHtml(params.plate)}
                </h1>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding:8px 0;border-bottom:1px solid #f1f5f9;">
                      <span style="font-size:13px;font-weight:700;color:#0f172a;">ID cerere</span><br/>
                      <span style="font-size:13px;color:#475569;font-family:monospace;">${escapeHtml(params.requestId)}</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;">
                      <span style="font-size:13px;font-weight:700;color:#0f172a;">Primită la</span><br/>
                      <span style="font-size:13px;color:#475569;">${formatRoDateTime(params.createdAt)}</span>
                    </td>
                  </tr>
                </table>
                <a href="${adminUrl}" style="display:inline-block;margin-top:24px;background:${BRAND_BLUE};color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 20px;border-radius:10px;">
                  Completează în admin
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
 * Notifică adminul (ADMIN_EMAIL) la fiecare cerere nouă de verificare
 * publică — trimis din createVerificationRequestAction imediat după un
 * insert reușit în verification_requests. Best-effort, ca toate email-urile
 * din aplicație: eșec grațios, nu aruncă niciodată — cererea rămâne salvată
 * și vizibilă în /admin/verifications indiferent dacă notificarea pleacă.
 */
export async function sendNewVerificationRequestEmail(
  params: NewVerificationRequestEmailParams
): Promise<boolean> {
  const resend = getResendClient();
  if (!resend) {
    console.warn("RESEND_API_KEY nesetat — notificarea de cerere nouă nu a fost trimisă.");
    return false;
  }

  try {
    const { error } = await resend.emails.send({
      from: "Zero Amenzi <onboarding@resend.dev>",
      to: ADMIN_EMAIL,
      subject: `Cerere de verificare nouă — ${params.plate}`,
      html: buildHtml(params),
    });
    if (error) {
      console.error("Resend a refuzat notificarea de cerere nouă:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Trimiterea notificării de cerere nouă a eșuat:", err);
    return false;
  }
}
