import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "src/sw.ts",
  swDest: "public/sw.js",
  // Dezactivat în dev — nu interferează cu HMR, activ doar la build de producție.
  disable: process.env.NODE_ENV !== "production",
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

  // Security headers (F-09). Deliberat FĂRĂ Content-Security-Policy aici —
  // pagina de admin și emailurile HTML din src/lib/email/ folosesc destul
  // inline styling încât un CSP scris în grabă ar rupe ceva. CSP-ul se
  // adaugă separat, întâi în Report-Only, ca să se vadă ce ar bloca înainte
  // să blocheze efectiv.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
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
