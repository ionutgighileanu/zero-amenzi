import { ADMIN_EMAIL } from "@/lib/constants";

/**
 * Linkul de contact pentru activarea manuală a Premium. Cât timp procesatorul
 * de plată nu e conectat (D-024), emailul e singura cale de deblocare peste
 * plafonul de trial — deci trebuie să existe peste tot unde apare plafonul,
 * cu subiect precompletat ca cererea să fie recunoscută imediat în inbox.
 */
export function premiumContactHref(): string {
  const subject = encodeURIComponent("Activare Premium — Zero Amenzi");
  return `mailto:${ADMIN_EMAIL}?subject=${subject}`;
}
