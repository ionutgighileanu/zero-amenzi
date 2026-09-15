import { ADMIN_EMAIL, BRAND_BLUE } from "@/lib/constants";
import { getResendClient } from "@/lib/email/client";
import { escapeHtml } from "@/lib/email/escape";

export type DigestRequest = {
  id: string;
  plate: string;
  createdAt: string;
};

export type VerificationDigestParams = {
  requests: DigestRequest[];
  appUrl: string;
};

function formatRoTime(iso: string): string {
  return new Date(iso).toLocaleString("ro-RO", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function buildRows(params: VerificationDigestParams): string {
  return params.requests
    .map((request) => {
      const url = `${params.appUrl}/admin/verifications?request=${encodeURIComponent(request.id)}`;
      return `
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #f1f5f9;">
            <a href="${escapeHtml(url)}" style="font-size:15px;font-weight:700;color:${BRAND_BLUE};text-decoration:none;letter-spacing:0.04em;">
              ${escapeHtml(request.plate)}
            </a><br/>
            <span style="font-size:12px;color:#64748b;">${escapeHtml(formatRoTime(request.createdAt))}</span>
          </td>
        </tr>`;
    })
    .join("");
}

function buildHtml(params: VerificationDigestParams): string {
  const count = params.requests.length;
  const title = count === 1 ? "O cerere nouă de verificare" : `${count} cereri noi de verificare`;

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
                  De completat
                </p>
                <h1 style="margin:0 0 20px;font-size:22px;color:#0f172a;">
                  ${escapeHtml(title)}
                </h1>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  ${buildRows(params)}
                </table>
                <a href="${escapeHtml(`${params.appUrl}/admin/verifications`)}" style="display:inline-block;margin-top:24px;background:${BRAND_BLUE};color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 20px;border-radius:10px;">
                  Deschide panoul admin
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
 * Trimite adminului UN email cu toate cererile neanunțate (F-02).
 *
 * Înlocuiește emailul per cerere: gruparea ține consumul de cotă Resend
 * proporțional cu timpul, nu cu numărul de cereri, deci un val de cereri
 * automate nu mai poate epuiza plafonul zilnic de 100.
 *
 * Best-effort, ca toate emailurile din aplicație: eșecul nu aruncă, doar
 * întoarce `false`, iar apelantul decide să nu marcheze cererile ca anunțate.
 */
export async function sendVerificationDigestEmail(
  params: VerificationDigestParams
): Promise<boolean> {
  if (params.requests.length === 0) return true;

  const resend = getResendClient();
  if (!resend) {
    console.warn("RESEND_API_KEY nesetat — digestul de cereri nu a fost trimis.");
    return false;
  }

  const count = params.requests.length;
  try {
    const { error } = await resend.emails.send({
      from: "Zero Amenzi <onboarding@resend.dev>",
      to: ADMIN_EMAIL,
      subject:
        count === 1
          ? `O cerere nouă de verificare — ${params.requests[0].plate}`
          : `${count} cereri noi de verificare`,
      html: buildHtml(params),
    });
    if (error) {
      console.error("Digestul de cereri nu a putut fi trimis:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Digestul de cereri nu a putut fi trimis:", err);
    return false;
  }
}
