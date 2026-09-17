import { NotConfiguredPaymentProvider } from "@/lib/payments/not-configured";
import type { PaymentProvider } from "@/lib/payments/types";

export type {
  BillingDetails,
  CheckoutRequest,
  CheckoutResult,
  PaymentProvider,
  WebhookResult,
} from "@/lib/payments/types";

let cached: PaymentProvider | null = null;

/**
 * Singurul loc din aplicație care decide CARE procesator se folosește.
 *
 * ── AICI CONECTEZI PROCESATORUL REAL ──────────────────────────────────────
 * Când ai firmă și cont de procesator:
 *   1. instalezi SDK-ul lui
 *   2. scrii o clasă care implementează PaymentProvider (vezi types.ts)
 *      — createCheckout: creează sesiunea de plată și întoarce URL-ul
 *      — handleWebhook: verifică semnătura și întoarce { status: "paid", ... }
 *   3. adaugi ramura de mai jos, după variabila de mediu:
 *
 *        if (process.env.PAYMENT_PROVIDER === "stripe") {
 *          cached = new StripePaymentProvider();
 *          return cached;
 *        }
 *
 * Restul aplicației nu se schimbă: acțiunea de upgrade și ruta de webhook
 * vorbesc doar cu interfața.
 * ──────────────────────────────────────────────────────────────────────────
 */
export function getPaymentProvider(): PaymentProvider {
  if (cached) return cached;
  cached = new NotConfiguredPaymentProvider();
  return cached;
}

/** Există un procesator real conectat? Folosit de UI ca să ascundă butonul de
 * plată în loc să-l arate și să dea eroare la click. */
export function isPaymentConfigured(): boolean {
  return getPaymentProvider().name !== "not-configured";
}
