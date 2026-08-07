# Audit responsive design — 2026-08-07

## Metodologie

Testat cu Chromium (Playwright), server local `next dev`, la lățimile 375px, 412px, 768px, 1024px, 1440px, plus orientare landscape la 375px lățime × 375px înălțime (667×375 real, echivalentul unui telefon rotit).

Pentru fiecare combinație pagină×lățime am rulat: măsurare `scrollWidth` document vs. viewport (overflow orizontal), scanare a tuturor elementelor interactive (`button`, `a`, `input`, `[role="button"]`) pentru înălțime sub 44px, scanare a elementelor cu `text-overflow: ellipsis` unde textul e efectiv trunchiat, măsurare a containerelor `overflow-x-auto` (tabelul B2B), plus capturi de ecran pentru verificare vizuală directă (modale, plăcuța RO, spacing).

**Notă despre `/app/garage` și `/app/fleet/[orgId]`**: acest sandbox nu are acces de rețea către Supabase, deci nu pot obține o sesiune reală autentificată — pe live, ambele rute redirecționează necondiționat la `/login`. Am creat temporar două rute de previzualizare (`/audit-preview/garage`, `/audit-preview/fleet`) care randează exact aceleași componente de producție (`GarageBoard`, `FleetBoard`, `AppHeader`) cu date fixture reprezentative (inclusiv un nume de model foarte lung, un nume de șofer foarte lung, un vehicul fără niciun document, un camion cu tahograf). Aceste rute au fost șterse după audit — nu au ajuns în commit.

Un cerc negru cu litera „N" vizibil în unele capturi e badge-ul de dev tools al Next.js (colț stânga-jos), nu un element din aplicație — ignorat în raport.

## Rezultate

| Pagină | Lățime | Problemă | Severitate |
|---|---|---|---|
| `/` (landing) | 375-landscape (667×375) | Rândul de navigare desktop (`Cum funcționează / Verificări / Tarife / Întrebări / Conectare`) apare la breakpoint-ul `sm:` (≥640px), dar conținutul necesită ~695px pe doar 667px disponibili → **overflow orizontal de 28px pe toată pagina**, scroll orizontal apare pe orice telefon rotit landscape | **P0** |
| `/` (landing) | toate (375–1440) | Butoane CTA sub 44px înălțime: „Meniu" hamburger (36px), „Creează cont gratuit" (40-42px), „Activează PRO" (40px), „Conectează firma" (40-42px), linkuri nav (17-20px) | P2 |
| `/` (landing) | 375, 412, 768, 1024, 1440 | Fără overflow orizontal, fără text trunchiat vizibil, mockup-ul mini-tabel „Pentru firme" se redă corect la toate lățimile | — (OK) |
| `/login` | toate (375–1440, incl. landscape) | Fără overflow, fără trunchiere. Butoane sub 44px: „Intră în cont" (36px), „Continuă cu Google" (38px), logo-link (40px) | P2 |
| `/login` | toate | Layout, input-uri, spacing — toate corecte la toate lățimile | — (OK) |
| `/signup` | toate (375–1440, incl. landscape) | Fără overflow, fără trunchiere. Toggle „Persoană fizică" / „Firmă" (36px), buton „Creează cont" (36px) — sub 44px | P2 |
| `/signup` | toate | Toggle-ul B2C/B2B, câmpurile „Nume firmă" + „CUI" se redau corect la 375px (grid 2/3 + 1/3), fără overflow | — (OK) |
| `/app/garage` | toate (375–1440, incl. landscape) | Grid-ul de carduri se reflow corect (1 → 2 → 3 coloane), niciun overflow orizontal la nicio lățime | — (OK) |
| `/app/garage` | toate | Butoane sub 44px, prezente consecvent la toate lățimile: iconițe header (Bell 33px, Logout 32px, ContextSwitcher 32px), „Tipuri alerte" (38px), „Adaugă vehicul" (36px), „Reînnoiește RCA" per card (36-38px), „CASCO" per card (36-38px) | **P1** (butonul RCA e acțiunea de monetizare principală — merită tap target corect) |
| `/app/garage` | 375, 412 | Modal „Adaugă un vehicul": butoanele „Anulează"/„Verifică și adaugă" (flex 1:1) fac textul „Verifică și adaugă" să se rupă pe 2 rânduri — nu se taie, dar e cramponat vizual | P2 |
| `/app/garage` | 375, 1440 | Modal „Detalii vehicul" (VehicleDetail): complet vizibil, fără clipping, se redă identic la ambele extreme; nume de model foarte lung se înfășoară corect pe 2 rânduri fără overflow | — (OK) |
| `/app/garage` | 375 | Modal „Tipuri alerte": toate presetările + input custom + contor „X/15" vizibile complet, fără scroll necesar | — (OK) |
| `/app/fleet/[orgId]` | 375 | **Tabelul de vehicule are lățime intrinsecă 1069px vs. 341px disponibili în container** — doar coloanele „Vehicul" și „RCA" sunt vizibile; ITP, Rovinietă, Tahograf și butoanele de acțiune (RCA/CASCO/chevron) sunt complet ascunse, **fără niciun indiciu vizual că mai există conținut la scroll orizontal** (fără gradient/umbră/săgeată) | **P0** |
| `/app/fleet/[orgId]` | 412 | Aceeași problemă ca la 375 (378px vs 1069px disponibili) — practic identic, telefonul mai lat nu ajută | **P0** |
| `/app/fleet/[orgId]` | 768 | Tabelul arată ~718px din 1069px — coloana Tahograf și butoanele de acțiune (RCA/CASCO/chevron) rămân tăiate, tot fără afordanță de scroll vizibilă | **P1** |
| `/app/fleet/[orgId]` | 1024 | Overflow rezidual de doar 95px, dar exact butonul „CASCO" și chevron-ul de „Detalii" sunt tăiate la marginea din dreapta — utilizatorul nu vede că poate deschide oferta CASCO fără să descopere accidental scroll-ul | **P1** |
| `/app/fleet/[orgId]` | 1440 | Tabelul încape complet, toate cele 5 coloane + acțiunile vizibile fără scroll | — (OK) |
| `/app/fleet/[orgId]` | 375-landscape (667×375) | Aceeași trunchiere a tabelului ca la 375/412 portret — vizibile doar „Vehicul", „RCA", parțial „ITP" | **P0** |
| `/app/fleet/[orgId]` | toate | Header-ele de sortare din tabel (`Vehicul ↑`, `RCA ⇅`, etc.) au **doar 17px înălțime de tap target** — sub jumătate din minimul de 44px, cea mai mică zonă de tap din toată aplicația | **P1** |
| `/app/fleet/[orgId]` | 768, 1024, 1440 | Tab-urile „Vehicule" / „Șoferi" scad de la 34px (375/412) la **20px** înălțime de tap la ≥768px — o regresie de accesibilitate exact la lățimile unde tabletele (ex. iPad landscape la 1024px) sunt încă ecrane tactile | **P1** |
| `/app/fleet/[orgId]` | toate | Aceleași butoane sub 44px ca pe garage (header, „Tipuri alerte", „Adaugă vehicul/șofer"), plus bara de căutare (38px) | P2 |
| `/app/fleet/[orgId]` | 375, 1440 | Modal „Detalii vehicul" (isB2B, cu rând Tahograf) și „Detalii șofer": complet vizibile la ambele extreme; nume de șofer foarte lung se trunchiază elegant cu „…" în header-ul modalului, dar apare complet, needitat, în câmpul „Nume complet" de mai jos | — (OK) |
| `/app/fleet/[orgId]` | — | Plăcuța RO (`Plate` component): nicio deformare vizibilă în capturile de la 375 până la 1440 — proporția pare fixă indiferent de container | — (OK, verificat vizual) |

## Rezumat pe severitate

- **P0 (3 grupuri de probleme)**: overflow orizontal pe landing în landscape; tabelul B2B complet/parțial ilizibil la 375px, 412px și 375-landscape **fără nicio afordanță vizuală de scroll**.
- **P1 (5 grupuri)**: tabelul B2B tăiat la 768px și 1024px; header-ele de sortare cu tap target de 17px; tab-urile Vehicule/Șoferi care scad la 20px pe ecrane ≥768px; butoanele „Reînnoiește RCA"/„CASCO" (acțiunea de monetizare) sub 44px pe garage.
- **P2 (multiple, transversale)**: aproape toate butoanele din header și din CTA-uri sunt între 32-42px înălțime — sub standardul de 44px, dar consistente și nu blochează funcțional interacțiunea pe majoritatea dispozitivelor.

## Cel mai urgent de reparat

Tabelul din `/app/fleet/[orgId]` la 375px/412px este singura problemă care **ascunde informație critică** (ITP, Rovinietă, Tahograf, butonul RCA) fără ca utilizatorul să știe că trebuie să facă scroll orizontal — pe un ecran de telefon, exact contextul în care un șofer/dispecer ar verifica rapid o flotă. Recomand fie carduri stivuite (ca pe `/app/garage`) sub 768px, fie minim un indicator vizual de scroll (gradient pe margine + eventual "sticky" pe prima coloană).
