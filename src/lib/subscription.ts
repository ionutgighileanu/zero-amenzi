/**
 * Regulile de abonament (D-019).
 *
 * Modelul are două niveluri independente:
 *   - spaces.subscription_status + trial_ends_at — trialul, la nivel de spațiu
 *   - vehicles.paid_until                        — plata concretă, per vehicul
 *
 * Nu e all-or-nothing: dacă trialul expiră și ai plătit 2 din 3 mașini, cele
 * două plătite rămân accesibile și doar a treia se blochează.
 *
 * Funcțiile primesc `now` ca parametru ca să fie testabile fără să manipulăm
 * ceasul de sistem; implicit e momentul apelului.
 */

export type SubscriptionStatus = "trialing" | "active" | "expired";
export type SpaceKind = "personal" | "fleet";

/** Prețul per vehicul, pe an, în lei. Identic pentru persoane fizice și
 * firme — singura diferență la B2B e facturarea pe CUI, care vine odată cu
 * procesatorul de plată. */
export const VEHICLE_PRICE_RON_PER_YEAR = 12;

/**
 * Câte vehicule acoperă perioada gratuită, per spațiu (D-024).
 *
 * Inversează „vehicule nelimitate în trial" din D-019. Se aplică identic la
 * B2C și B2B. Plafonul e pe trial, nu pe mărimea garajului: vehiculele
 * plătite nu intră în numărătoare.
 */
export const TRIAL_VEHICLE_LIMIT = 1;

export const TRIAL_LIMIT_MESSAGE =
  "Planul gratuit include 1 vehicul. Trece la Premium pentru a adăuga mai multe.";

/** Durata perioadei gratuite. Oglindește default-ul din DB
 * (`spaces.trial_ends_at default now() + interval '1 year'`). */
export const TRIAL_DURATION_LABEL = "1 an";

/** Forma minimă de spațiu de care au nevoie regulile — orice obiect care o
 * satisface merge, ca să nu legăm logica de forma exactă a rândului din DB. */
export type SubscribableSpace = {
  subscriptionStatus: SubscriptionStatus;
  trialEndsAt: string;
};

/**
 * Starea de acces a unui vehicul:
 *   trial  — acoperit de perioada gratuită a spațiului
 *   paid   — plătit individual, valabil
 *   locked — fără acces: datele RCA/ITP/Rovinietă nu se arată
 */
export type VehicleAccess = "trial" | "paid" | "locked";

export function isTrialActive(space: SubscribableSpace, now: Date = new Date()): boolean {
  return space.subscriptionStatus === "trialing" && new Date(space.trialEndsAt) > now;
}

/**
 * Regula centrală. Ordinea contează: verificăm întâi plata, fiindcă un vehicul
 * plătit rămâne accesibil chiar dacă trialul spațiului a expirat între timp.
 */
export function vehicleAccess(
  space: SubscribableSpace,
  paidUntil: string | null,
  now: Date = new Date()
): VehicleAccess {
  if (paidUntil && new Date(paidUntil) > now) return "paid";
  if (isTrialActive(space, now)) return "trial";
  return "locked";
}

export function isVehicleAccessible(
  space: SubscribableSpace,
  paidUntil: string | null,
  now: Date = new Date()
): boolean {
  return vehicleAccess(space, paidUntil, now) !== "locked";
}

/**
 * Poate spațiul să primească un vehicul nou?
 *
 * Oglindește triggerul `enforce_vehicle_subscription_rules` (migrările
 * 20260917100000 și 20260918150000) — DB-ul rămâne autoritatea, asta e doar
 * ca să dăm un mesaj clar în interfață în loc să lăsăm insertul să pice cu o
 * eroare Postgres.
 *
 * `unpaidVehicleCount` = vehiculele NEPLĂTITE ale spațiului, inclusiv cele
 * soft-deleted. Trialul se consumă la adăugare și nu se eliberează prin
 * ștergere, altfel ciclul adaugă/șterge ar da vehicule gratuite la infinit.
 */
export function canAddVehicle(
  space: SubscribableSpace,
  unpaidVehicleCount: number,
  now: Date = new Date()
): { allowed: true } | { allowed: false; reason: string } {
  if (space.subscriptionStatus === "expired") {
    return {
      allowed: false,
      reason: "Perioada gratuită de 1 an a expirat. Fă upgrade la Premium ca să adaugi vehicule.",
    };
  }
  if (space.subscriptionStatus === "trialing" && !isTrialActive(space, now)) {
    return {
      allowed: false,
      reason: "Perioada gratuită de 1 an a expirat. Fă upgrade la Premium ca să adaugi vehicule.",
    };
  }
  // Plafonul se aplică doar în trial. Un spațiu 'active' (a plătit) poate
  // adăuga oricâte: fără `paid_until` propriu, vehiculul apare blocat până la
  // plată, deci nu e acces gratuit.
  if (space.subscriptionStatus === "trialing" && unpaidVehicleCount >= TRIAL_VEHICLE_LIMIT) {
    return { allowed: false, reason: TRIAL_LIMIT_MESSAGE };
  }
  return { allowed: true };
}

/** Mesajul de pe un vehicul blocat, pentru interfață. */
export function lockedVehicleMessage(plate: string): string {
  return `Abonamentul pentru ${plate} a expirat — reînnoiește (${VEHICLE_PRICE_RON_PER_YEAR} lei/an).`;
}
