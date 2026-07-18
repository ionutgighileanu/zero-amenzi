# AutoDocs — Context pentru Claude Code

## Ce este proiectul
SaaS freemium pentru managementul documentelor auto pe piața din România.
Monitorizează RCA, ITP, Rovinietă, CASCO și trimite alerte înainte de expirare.
Monetizare prin comision broker la RCA/CASCO cumpărat prin platformă.

## Stack
- **Framework:** Next.js 15 (App Router) + TypeScript
- **Styling:** Tailwind CSS + Shadcn UI
- **Backend/Auth/DB:** Supabase (Postgres + Row Level Security + Auth)
- **PWA:** next-pwa, Web Push API
- **Hosting:** Vercel (frontend) + Supabase (backend)

## Structura rute (App Router)
```
/                        → Landing page (src/prototypes/autodocs-landing.jsx)
/login                   → Autentificare
/signup                  → Înregistrare (persoană fizică sau firmă)
/app                     → Dashboard (protejat, necesită auth)
/app/garage              → Garaj personal (B2C — carduri vehicule)
/app/fleet/[orgId]       → Dashboard flotă (B2B — tabel vehicule + șoferi)
/verificare-itp          → Pagină publică SEO
/verificare-rca          → Pagină publică SEO
/verificare-rovinieta    → Pagină publică SEO
/calculator-rca          → Comparator oferte RCA
```

## Brand & Culori
- **Albastru plăcuță RO:** `#003399`
- **Font titluri:** Archivo (800/900 weight)
- **Font body:** Inter
- **Semafor documente:**
  - Valid (>15 zile): punct verde discret `emerald-500`
  - Avertizare (≤15 zile): pill amber cu „X zile"
  - Expirat: pill roșu solid „Expirat"

## Prototipuri vizuale (referință, nu cod de producție)
- `src/prototypes/autodocs-landing.jsx` — landing page complet
- `src/prototypes/autodocs-prototype.jsx` — dashboard app (B2C + B2B)

## Model de date (schiță)
```
users               → profil utilizator (id, email, created_at)
organizations       → firme (id, name, cui, owner_id)
memberships         → user ↔ org (user_id, org_id, role: owner|admin|member)
vehicles            → mașini (id, plate, vin, owner_id, org_id, is_truck)
vehicle_docs        → documente per mașină (id, vehicle_id, type, expires_at)
drivers             → șoferi (id, org_id, name, phone)
driver_certs        → atestate șofer (id, driver_id, type, expires_at)
notifications_log   → istoric alerte trimise
```

## Decizii arhitecturale importante
- **Identity + Spaces:** un cont poate deține garaj personal ȘI una sau mai multe flote
- **Fără documente de identitate:** nu stocăm buletin, permis sau copii acte — doar date de expirare
- **Freemium:**
  - Free: 1 vehicul, verificare unică, alerte email
  - PRO: 15 lei/an/vehicul, vehicule nelimitate, SMS, actualizare recurentă, ARR, alerte extra
  - PRO gratuit la fiecare RCA cumpărat prin platformă
- **B2C:** carduri cu semafor, minimal, airy
- **B2B:** tabel compact sortabil/filtrabil, KPI strip, tab șoferi

## Convenții de cod
- Toate componentele în `src/components/`
- Server Components implicit, `"use client"` doar unde e nevoie de interactivitate
- Variabile de mediu în `.env.local` (niciodată committed)
- RLS activat pe toate tabelele Supabase — niciodată bypass fără motiv explicit

## Variabile de mediu necesare
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=      # doar pe server, niciodată expus
NEXT_PUBLIC_APP_URL=
```

## Comenzi utile
```bash
npm run dev          # development server pe localhost:3000
npm run build        # build de producție
npm run lint         # ESLint
npx supabase start   # Supabase local (dacă folosești CLI)
```

## Skills
- [pm-skills](https://github.com/phuryn/pm-skills)
- [gstack](https://github.com/garrytan/gstack)
- [frontend-design](https://www.skills.sh/anthropics/skills/frontend-design)
- [agent-skills](https://github.com/vercel-labs/agent-skills)
- [mattpocock/skills](https://github.com/mattpocock/skills)
- [getsentry/skills](https://github.com/getsentry/skills)
- [compound-engineering-plugin](https://github.com/EveryInc/compound-engineering-plugin)
- [hyperframes](https://github.com/heygen-com/hyperframes)
- [impeccable](https://github.com/pbakaus/impeccable)
- [superpowers](https://github.com/obra/superpowers)
