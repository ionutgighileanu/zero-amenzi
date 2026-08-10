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
};

export default withSerwist(nextConfig);
