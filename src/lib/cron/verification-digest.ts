import { createAdminClient } from "@/lib/supabase/admin";
import { sendVerificationDigestEmail, type DigestRequest } from "@/lib/email/send-verification-digest";

/** Plafon per rulare: un digest cu sute de rânduri e nefolositor, iar dacă
 * s-au adunat atâtea cereri, următoarea rulare le ia pe restul. */
const MAX_PER_DIGEST = 50;

export type DigestResult = { found: number; sent: number };

/**
 * Trimite adminului un singur email cu cererile de verificare neanunțate,
 * apoi le marchează ca anunțate (F-02).
 *
 * Ordinea contează: marcăm DUPĂ ce emailul a plecat. Dacă trimiterea eșuează,
 * rândurile rămân neanunțate și intră în digestul următor — preferăm o
 * notificare întârziată uneia pierdute.
 */
export async function sendVerificationDigest(): Promise<DigestResult> {
  const supabase = createAdminClient();

  const { data: rows, error } = await supabase
    .from("verification_requests")
    .select("id, plate_number, created_at")
    .is("admin_notified_at", null)
    .order("created_at", { ascending: true })
    .limit(MAX_PER_DIGEST);

  if (error) {
    console.error("Nu am putut citi cererile pentru digest:", error);
    return { found: 0, sent: 0 };
  }

  const pending = rows ?? [];
  if (pending.length === 0) return { found: 0, sent: 0 };

  const requests: DigestRequest[] = pending.map((row) => ({
    id: row.id,
    plate: row.plate_number,
    createdAt: row.created_at,
  }));

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const ok = await sendVerificationDigestEmail({ requests, appUrl });

  if (!ok) return { found: pending.length, sent: 0 };

  const { error: markError } = await supabase
    .from("verification_requests")
    .update({ admin_notified_at: new Date().toISOString() })
    .in(
      "id",
      requests.map((request) => request.id)
    );

  if (markError) {
    // Emailul a plecat deja. Rândurile rămân neanunțate, deci adminul va primi
    // un digest cu aceleași cereri data viitoare — supărător, dar preferabil
    // unei cereri care nu ajunge niciodată la el.
    console.error("Digestul a plecat, dar marcarea a eșuat:", markError);
  }

  return { found: pending.length, sent: requests.length };
}
