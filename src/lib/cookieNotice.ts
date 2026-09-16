"use client";

/**
 * Stare partajată pentru notificarea despre cookie-uri.
 *
 * Există ca modul separat fiindcă două componente au nevoie de ea: bannerul
 * o scrie, iar CTA-ul fix de pe mobil o citește ca să nu se suprapună peste
 * banner. Fără coordonare, un vizitator nou pe telefon ar vedea două bare
 * lipite una de alta în partea de jos a ecranului.
 */

export const COOKIE_NOTICE_KEY = "za-cookie-notice-dismissed";

/** Evenimentul prin care bannerul anunță CTA-ul că s-a închis, fără ca cele
 * două componente să aibă nevoie de un părinte comun cu stare. */
export const COOKIE_NOTICE_EVENT = "za:cookie-notice-dismissed";

/** localStorage poate arunca în modul privat — tratăm eșecul ca „neînchis". */
export function isCookieNoticeDismissed(): boolean {
  try {
    return localStorage.getItem(COOKIE_NOTICE_KEY) !== null;
  } catch {
    return false;
  }
}

export function dismissCookieNotice(): void {
  try {
    localStorage.setItem(COOKIE_NOTICE_KEY, "1");
  } catch {
    // Modul privat: notificarea reapare la următoarea vizită. Acceptabil.
  }
  window.dispatchEvent(new Event(COOKIE_NOTICE_EVENT));
}
