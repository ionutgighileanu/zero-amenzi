import type {
  CheckoutRequest,
  CheckoutResult,
  PaymentProvider,
  WebhookResult,
} from "@/lib/payments/types";

/**
 * Providerul implicit, cât timp nu e conectat niciun procesator real.
 *
 * Nu simulează o plată reușită. Asta e deliberat: un mock care „reușește" ar
 * acorda Premium gratuit oricui apasă butonul, iar dacă ajunge din greșeală în
 * producție nimeni nu observă până nu se uită cineva la încasări. Așa,
 * comportamentul e evident greșit imediat.
 */
export class NotConfiguredPaymentProvider implements PaymentProvider {
  readonly name = "not-configured";

  async createCheckout(request: CheckoutRequest): Promise<CheckoutResult> {
    console.warn(
      `[payments] createCheckout apelat fără procesator configurat — ` +
        `space=${request.spaceId}, vehicule=${request.vehicleIds.length}, ` +
        `total=${(request.amountMinor / 100).toFixed(2)} ${request.currency}` +
        (request.billing ? `, facturare pe CUI ${request.billing.cui}` : "")
    );

    return {
      status: "not_configured",
      message:
        "Plata online nu e disponibilă încă. Scrie-ne și îți activăm Premium manual.",
    };
  }

  async handleWebhook(): Promise<WebhookResult> {
    // Fără procesator nu există webhook-uri legitime. Dacă ajunge ceva aici,
    // e fie o configurare greșită, fie cineva care sondează endpoint-ul.
    console.warn("[payments] webhook primit fără procesator configurat — ignorat.");
    return { status: "invalid", message: "Niciun procesator de plată configurat." };
  }
}
