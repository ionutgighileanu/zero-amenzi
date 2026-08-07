# Fix-uri responsive — 2026-08

Implementare a găsirilor din `docs/audit-responsive-2026-07.md`. Doar layout și dimensiuni — niciun comportament sau date modificate.

## P0 — Overflow nav landing în landscape

**Fișier**: `src/components/landing/Nav.tsx`

Breakpoint-ul navigării desktop era `sm:` (640px), dar conținutul (5 linkuri + 2 butoane) are nevoie de ~695px. La 667px lățime (telefon landscape), nava desktop apărea și producea overflow orizontal de 28px pe toată pagina.

Fix: breakpoint mutat de la `sm:` (640px) la `md:` (768px), atât pentru afișarea navigării desktop cât și pentru butonul hamburger + panoul mobil. Verificat: la 768px conținutul încape fără overflow (confirmat și în auditul inițial); la 667px acum se arată hamburger-ul, fără overflow.

## P1/P2 — Button unificat cu tap targets de 44px

**Fișier**: `src/components/ui/Button.tsx`

Componenta exista deja (variante `primary`/`outline`/`ghost`/`danger`, size-uri `sm`/`md`/`lg`, suport `href` pentru rute interne/externe) și era deja folosită consecvent în toată aplicația. Singura schimbare: `min-h-11` (44px) adăugat pe toate cele trei size-uri, astfel încât orice buton din aplicație — pe landing, formulare, carduri de vehicul, rânduri de tabel — respectă standardul minim de tap target, indiferent unde e folosit.

Nu am creat butoane noi, nu am dublat componenta — cascada s-a propagat automat la toate cele 17 fișiere care importă `Button`.

## P0/P1 — Tabel B2B: card-uri stivuite sub 768px (decizie D-009)

**Fișiere noi**: `src/components/app/FleetVehicleCard.tsx`
**Fișier modificat**: `src/components/app/FleetBoard.tsx`

Conform D-009 (varianta A din opțiunile luate în calcul): sub breakpoint-ul `md` (768px), tabul „Vehicule” din `/app/fleet/[orgId]` randează card-uri stivuite în loc de tabel. Fiecare card conține:

- plăcuța RO (`Plate`) + iconiță camion dacă `truck: true`
- semafor pentru RCA, ITP, Rovinietă (și Tahograf, doar dacă e camion) — aceeași componentă `StatusCell` folosită și în tabel/garaj
- buton „Reînnoiește RCA” pe toată lățimea, vizibil doar dacă RCA e în warning sau expirat
- tap pe orice zonă a cardului deschide același `VehicleDetail` ca la click pe rând în tabel — nicio logică nouă, doar alt trigger vizual

La ≥768px tabelul original rămâne complet neschimbat (marcaj, coloane, sortare, butoane RCA/CASCO per rând) — doar învelit într-un `hidden md:block`, în timp ce card-urile sunt în `md:hidden`. Ambele variante există în DOM simultan; CSS decide care se vede, deci nu există o breakpoint-tranziție cu remount.

Verificat vizual la 375px, 768px și 1024px: sub 768px cardurile arată toate cele 4 documente + acțiunea RCA fără niciun scroll orizontal; la 1024px tabelul e identic cu comportamentul dinainte (inclusiv clipping-ul rezidual de ~95px acceptat prin decizia D-009, care privește doar sub 768px).

## P1 — Tap targets tabletă: header-e de sortare și tab-uri

**Fișier**: `src/components/app/FleetBoard.tsx`

- **Header-ele de sortare** din tabel (`Vehicul ↑`, `RCA ⇅`, etc.) aveau doar ~17px înălțime de tap. Butonul din interior a primit `min-h-11` (44px) cu padding orizontal propriu; celula `<th>` a pierdut padding-ul vertical fix, ca înălțimea reală să vină din buton.
- **Tab-urile „Vehicule”/„Șoferi”** scădeau de la 34px (mobil) la 20px (≥768px) din cauza padding-ului condiționat pe breakpoint. Adăugat `min-h-11` pe buton, aplicat uniform la toate lățimile — nu doar la cele înguste.

## Verificare

- `npx tsc --noEmit` — trece fără erori
- `npm run build` — trece, toate rutele `/app/*`, `/login`, `/signup` rămân corect dinamice
- `npx eslint src` — fără warning-uri
- Verificare vizuală (Chromium, viewport-uri temporare de test, șterse după verificare): overflow-ul de pe landing landscape dispare; tabul de vehicule pe fleet arată card-uri complete sub 768px; tabelul de la ≥768px e vizual identic cu înainte de fix.

## Ce nu a fost atins (intenționat, în afara scopului cerut)

- Butoanele-iconiță din `AppHeader` (Bell, Logout, ContextSwitcher) rămân sub 44px — erau clasificate P2 în audit, dar nu au fost incluse explicit în cele 4 priorități cerute.
- Toggle-ul B2C/B2B din `AuthForm` și modalul „Adaugă vehicul” (unde „Verifică și adaugă” se rupe pe 2 rânduri la 375px) rămân neschimbate — cosmetice, P2, neincluse în cerere.
