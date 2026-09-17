import type { SpaceKind } from "@/lib/subscription";

/**
 * Contractul cu procesatorul de plată (D-019).
 *
 * Deliberat agnostic: nu presupune Stripe, PayU, Netopia sau altceva. Nu
 * există niciun SDK instalat și nicio cheie în proiect. Implementarea reală se
 * adaugă mai târziu, ca o clasă care satisface `PaymentProvider`.
 *
 * Două lucruri pe care interfața trebuie să le acopere de la început, fiindcă
 * sunt greu de adăugat retroactiv:
 *   - facturare pe firmă (CUI), nu doar card personal — vezi `BillingDetails`
 *   - plată per vehicul, nu per cont — vezi `vehicleIds`
 */

/** Datele de facturare pentru o flotă. Lipsesc la persoane fizice. */
export type BillingDetails = {
  companyName: string;
  cui: string;
};

export type CheckoutRequest = {
  spaceId: string;
  spaceKind: SpaceKind;
  /** Vehiculele concrete care se plătesc. Prețul e per vehicul, iar webhook-ul
   * trebuie să știe exact pe care să le marcheze plătite. */
  vehicleIds: string[];
  /** Câți ani se plătesc deodată. Azi mereu 1; câmpul există ca o reînnoire pe
   * mai mulți ani să nu ceară schimbarea contractului. */
  periodYears: number;
  /** Totalul calculat pe server, în bani (1 leu = 100). Procesatorul nu
   * primește niciodată o sumă venită din client. */
  amountMinor: number;
  currency: "RON";
  customerEmail: string;
  /** Prezent doar pentru flote — procesatorul va emite factură pe firmă. */
  billing?: BillingDetails;
  /** Unde se întoarce utilizatorul după plată, respectiv după anulare. */
  returnUrl: string;
  cancelUrl: string;
};

export type CheckoutResult =
  /** Cazul obișnuit: utilizatorul e trimis la procesator. */
  | { status: "redirect"; url: string }
  /** Niciun procesator conectat încă — starea de azi. */
  | { status: "not_configured"; message: string }
  | { status: "error"; message: string };

/**
 * Ce a înțeles providerul dintr-un webhook. Aplicația nu se uită niciodată la
 * payload-ul brut: providerul îl verifică (semnătură) și îl traduce în asta.
 */
export type WebhookResult =
  /** Plată confirmată — aplicația acordă acces pe vehiculele indicate. */
  | { status: "paid"; spaceId: string; vehicleIds: string[]; periodYears: number }
  /** Eveniment valid dar fără efect (ex. plată inițiată, rambursare parțială). */
  | { status: "ignored"; reason: string }
  /** Semnătură invalidă sau payload nerecunoscut — răspundem 400. */
  | { status: "invalid"; message: string };

export interface PaymentProvider {
  /** Numele procesatorului, pentru loguri și pentru pagina de setări. */
  readonly name: string;

  /** Pornește o plată. Întoarce URL-ul unde trimitem utilizatorul. */
  createCheckout(request: CheckoutRequest): Promise<CheckoutResult>;

  /**
   * Verifică și interpretează un webhook.
   *
   * Primește corpul BRUT al cererii, nu JSON parsat: majoritatea
   * procesatoarelor semnează octeții exacți, iar un `JSON.parse` urmat de
   * `JSON.stringify` schimbă semnătura și face verificarea să eșueze.
   */
  handleWebhook(rawBody: string, headers: Headers): Promise<WebhookResult>;
}
