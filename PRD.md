# PRD — AutoDocs

## 1. Prezentare produs

AutoDocs e un SaaS freemium pentru managementul documentelor auto pe piața
din România. Monitorizează RCA, ITP, Rovinietă și CASCO și trimite alerte
înainte de expirare. Monetizare prin comision broker la RCA/CASCO cumpărat
prin platformă.

### 1.1 Poziționare

AutoDocs e cel mai simplu instrument de monitorizare acte auto din România —
un singur ecran care spune, fără interpretare, ce expiră și când. Prioritizăm
claritatea peste completitudinea: mai puține funcții afișate corect, în loc
de un dashboard care încearcă să facă totul. Semaforul (verde/amber/roșu) e
limbajul central al interfeței — orice ecran nou trebuie să vorbească aceeași
limbă vizuală, nu una nouă.

## 2. Problema

Amenzile pentru acte expirate sunt frecvente și evitabile: ITP expirat
(1.822–8.100 lei), RCA expirat (1.000–2.000 lei), rovinietă lipsă
(500–1.000 lei). Oamenii uită datele de expirare — mai ales cei cu mai multe
mașini sau cei care gestionează o flotă. O singură notificare la timp
scutește de mii de lei.

## 3. Segmente

- **B2C — persoană fizică**: garaj personal, 1-3 vehicule tipic, folosește
  aplicația ocazional, la nevoie.
- **B2B — firmă/flotă**: cont cu una sau mai multe organizații (roluri
  owner/admin/member), gestionează vehicule și șoferi, verifică des,
  compară stări multiple simultan.

Un singur cont poate avea și garaj personal ȘI aparține uneia sau mai
multor flote ("Identity + Spaces" — vezi CLAUDE.md).

## 4. Propunere de valoare

- **Free**: 1 vehicul, verificare unică, alerte email.
- **PRO**: 15 lei/an/vehicul — vehicule nelimitate, SMS, actualizare
  recurentă automată, alerte suplimentare configurabile.
- **PRO gratuit** la fiecare RCA cumpărat prin platformă.
- Monetizare principală: comision broker la RCA/CASCO cumpărat prin
  AutoDocs, nu abonamentul în sine.

## 5. Cerințe (MoSCoW)

### Must-Have (P0)

- Autentificare reală (email/parolă + Google OAuth), protecție rute — **făcut**
- Garaj personal B2C, CRUD complet pe vehicule și documente — **făcut**
- Dashboard flotă B2B, CRUD vehicule + șoferi, tabel sortabil/filtrabil — **făcut**
- Soft-delete cu fereastră de Undo de 30s — **făcut**
- RLS activat pe toate tabelele Supabase, fără bypass — **făcut**
- Notificări in-app + email pentru documente care expiră (cron zilnic) — **făcut**
- **Verificare publică a unui număr de înmatriculare, fără cont** — motorul
  de achiziție organică al produsului; vezi §5.1 pentru fluxul complet.
- **PWA instalabil** — manifest.json cu iconițe ZA pe #003399, service worker
  serwist cu CacheFirst pe assets statice și NetworkFirst cu fallback offline
  pe /app/*, banner de instalare discret pe landing + post-login (dismiss
  persistent în localStorage), dezactivat în development ca să nu interfereze
  cu HMR. Web Push exclus din Faza 2 — vezi D-012. — **făcut**

## 5.1 UX Flow — Verificare publică (P0)

### Problema
Pagina de verificare e promisiunea centrală a produsului („află statusul în <30s"), dar în MVP folosim wizard-of-oz (admin completează manual). Momentul de tranziție de la „așteptare instant" la „revii mai târziu" e critic — dacă e prost, utilizatorul pleacă și nu revine.

### Principii de design
1. Onestitate calibrată — nu ascundem că e asincron, dar prezentăm progresul, nu absența lui
2. Multiple canale de revenire — link + email, utilizatorul alege
3. Continuitate vizuală — aceeași pagină de rezultat, doar cu stări diferite (pending → completed)
4. Progresul ca semafor invers — spinnere care se transformă în semafor calibrat

### Fluxul complet

Ecran 1 — Landing (existent, ajustare mesaj):
- Input plăcuță RO stilizat + buton „Verifică actele"
- Copy: „Introdu numărul de înmatriculare. Îți spunem ce acte au expirat."

Ecran 2 — Modal după submit:
- Titlu: „Verificarea a pornit"
- Body: „Verificăm actele pentru [PLĂCUȚĂ]. Îți trimitem rezultatul pe email de îndată ce e gata."
- Input opțional email cu placeholder „email@exemplu.ro (opțional)"
- Buton primar: „Deschide pagina de progres"
- Buton secundar: „Închide"
- Text mic sub butoane: „Salvează linkul dacă nu lași email — e singurul mod să revii la rezultat."

Ecran 3 — Pagina de progres /verificare/[token]:

Stare pending:
- Plăcuța RO mare (componenta Plate existentă)
- 3 rânduri sub plăcuță pentru ITP/RCA/Rovinietă cu spinner subtil + „Se verifică..."
- Badge amber discret: „De obicei durează sub 24h"
- Buton secundar: „Creează cont pentru alerte automate" → /signup
- Text mic: „Nu închide tabul — pagina se actualizează automat când e gata"
- Refresh automat la 30 secunde

Stare completed:
- Aceeași plăcuță, aceleași 3 rânduri, dar cu semafor calibrat (verde/amber cu zile/roșu)
- Format: „ITP · Valid până la DD.MM.YYYY" / „RCA · Expiră în X zile · DD.MM.YYYY" / „Rovinietă · EXPIRATĂ"
- CTA primar: „Creează cont gratuit ca să primești alerte cu 30 de zile înainte"
- CTA secundar condiționat: dacă RCA e amber/roșu → „Cumpără RCA acum"

Stare invalidă:
- „Link invalid sau expirat. Fă o verificare nouă."
- Buton: „Verifică alt număr" → /verificare

### Metrici de urmărit
- Procentul de utilizatori care revin la link
- Procentul care lasă email
- Timp mediu de la cerere la completare (SLA operațional)
- Conversie de la pagină rezultat completat → signup

### Ce evităm intenționat
- Countdown timer fals
- Progres cu procente false
- Redirect automat la /signup
- Popup-uri „nu pleca!"

### Should-Have (P1)

- Pagini publice SEO dedicate (`/verificare-itp`, `/verificare-rca`,
  `/verificare-rovinieta`, `/calculator-rca`) — nefăcut
- Sursă de date automată pentru verificare (RAR/ASF/CNAIR) — vezi §7,
  Open Question nerezolvată; vezi și D-010
- Freemium gating real (limita de 1 vehicul pentru cont Free, flow de
  upgrade PRO cu plată) — nefăcut, doar afișare cosmetică `is_premium`
- Integrare broker RCA/CASCO cu plată reală și urmărire comision — nefăcut,
  UI complet mock în prezent

### Could-Have (P2)

- Web Push (canalele email + in-app sunt suficiente pentru primii
  utilizatori — vezi D-012)
- SMS pentru alerte PRO
- Stare de citire per-membru pe notificările de flotă (în prezent e
  partajată la nivel de organizație — simplificare MVP)

### Won't-Have (pentru moment)

- Stocarea documentelor de identitate (buletin, permis) — interzisă
  explicit, nu doar amânată (vezi CLAUDE.md, „Decizii arhitecturale")
- Scraping automat al surselor oficiale fără o decizie legală clarificată

## 6. Model de date

Vezi CLAUDE.md → „Model de date" pentru schița completă (`users`,
`organizations`, `memberships`, `vehicles`, `vehicle_docs`, `drivers`,
`driver_certs`, `notifications_log`, `alert_types`). Tabelul
`verification_requests` (verificare publică) e documentat separat în
migrarea `supabase/migrations/*_verification_requests.sql`.

## 7. Open Questions

- **Sursa de date pentru verificare automată** (RAR/ASF/CNAIR) — nerezolvată.
  Nu există API public documentat pentru toate cele trei; opțiunile sunt
  scraping (fragil, risc legal), parteneriat/API comercial (cost, timp de
  integrare) sau continuarea wizard-of-oz-ului la scară mică. Vezi D-010.
- **Cum scalăm wizard-of-oz peste ~50 cereri/zi?** — la volum mic, timpul
  manual de completare e sub 5 minute/cerere; peste un prag, devine
  blocaj operațional. Vezi D-010, „Aș reveni dacă".
- **Provider SMS** pentru alertele incluse în planul PRO — neselectat.
