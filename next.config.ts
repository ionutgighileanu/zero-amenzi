import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "src/sw.ts",
  swDest: "public/sw.js",
  // Dezactivat în dev — nu interferează cu HMR, activ doar la build de producție.
  disable: process.env.NODE_ENV !== "production",
});

const isDev = process.env.NODE_ENV !== "production";

// Content Security Policy (F-09). Rulează deocamdată în Report-Only —
// browserul raportează ce ar bloca, fără să blocheze efectiv.
//
// Politica e un header static, nu per-request, așa că nu putem folosi nonce
// pentru scripturi. Next.js App Router injectează în fiecare pagină scripturi
// inline de bootstrap/hidratare (`self.__next_f.push(...)`), deci `script-src`
// are nevoie de 'unsafe-inline'. Vezi D-021 pentru ce înseamnă asta: CSP-ul
// în forma asta apără împotriva injectării de *surse externe* de script, dar
// NU împotriva unui XSS inline. Protecția completă cere nonce generat în
// middleware, ceea ce forțează randare dinamică și ar strica optimizarea
// statică a paginilor SEO — amânat deliberat.
const cspDirectives: Record<string, string[]> = {
  "default-src": ["'self'"],
  "script-src": ["'self'", "'unsafe-inline'", ...(isDev ? ["'unsafe-eval'"] : [])],
  // Tailwind v4, `motion` și next/font injectează stiluri inline.
  "style-src": ["'self'", "'unsafe-inline'"],
  // Fonturile Archivo/Inter sunt self-hostate de next/font la build —
  // niciun domeniu Google necesar.
  "font-src": ["'self'", "data:"],
  // Supabase: REST + Auth pe https, realtime pe wss. În dev, HMR merge pe ws.
  "connect-src": [
    "'self'",
    "https://*.supabase.co",
    "wss://*.supabase.co",
    ...(isDev ? ["ws://localhost:*"] : []),
  ],
  // data: pentru iconițe inline, blob: pentru imagini generate client-side.
  "img-src": ["'self'", "data:", "blob:"],
  "worker-src": ["'self'", "blob:"],
  "manifest-src": ["'self'"],
  // Nu folosim <object>/<embed>/<applet> nicăieri — blocare completă.
  "object-src": ["'none'"],
  "base-uri": ["'self'"],
  "form-action": ["'self'"],
  "frame-ancestors": ["'none'"],
};

// Colectorul de rapoarte (src/app/api/csp-report/route.ts). Ambele mecanisme
// sunt emise deliberat: `report-uri` e depreciat dar e singurul pe care îl
// citesc Safari și browserele mai vechi, `report-to` e succesorul implementat
// de Chrome/Edge. Un browser care le înțelege pe amândouă folosește doar
// `report-to`, deci nu primim rapoarte duplicate.
const CSP_REPORT_GROUP = "csp-endpoint";
const CSP_REPORT_PATH = "/api/csp-report";

const cspHeaderValue = [
  ...Object.entries(cspDirectives).map(
    ([directive, values]) => `${directive} ${values.join(" ")}`
  ),
  `report-uri ${CSP_REPORT_PATH}`,
  `report-to ${CSP_REPORT_GROUP}`,
].join("; ");

// Header-ul care definește grupul numit în `report-to`. Fără el, directiva
// `report-to` din CSP nu are unde să trimită nimic.
const reportToHeaderValue = JSON.stringify({
  group: CSP_REPORT_GROUP,
  max_age: 10886400,
  endpoints: [{ url: CSP_REPORT_PATH }],
});

const nextConfig: NextConfig = {
  /* config options here */
  // @serwist/next adaugă un hook `webpack()` la config indiferent de `disable`
  // — fără o secțiune `turbopack` explicită, Next 16 refuză să pornească
  // `next dev` (Turbopack implicit) considerând asta o configurare eronată.
  // Un obiect gol păstrează Turbopack activ în dev (rapid, HMR neatins);
  // hook-ul webpack rămâne complet inert acolo — rulează doar la
  // `next build --webpack`, singurul mod în care e nevoie pentru producție.
  turbopack: {},

  // Security headers (F-09).
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy-Report-Only", value: cspHeaderValue },
          { key: "Report-To", value: reportToHeaderValue },
          // Nu trimite URL-ul complet (inclusiv query string) către alte
          // origini la navigare — relevant fiindcă /verificare/[token] și
          // /verificare/status/[id] au identificatori neghicibili în URL,
          // pe care nu vrem să-i scurgem prin header-ul Referer.
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Împiedică browserul să reinterpreteze un fișier ca alt tip MIME
          // decât cel declarat — protecție ieftină împotriva unor clase de
          // atacuri bazate pe upload/servire de conținut.
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Aplicația nu are niciun motiv legitim să fie afișată într-un
          // <iframe> pe alt site — blochează clickjacking-ul complet.
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
    ];
  },
};

export default withSerwist(nextConfig);
