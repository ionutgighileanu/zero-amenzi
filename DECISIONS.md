# Decizii de produs — AutoDocs

## D-009 · 2026-07 · Tabelul B2B pe mobil: card-uri stivuite sub 768px

Context: Tabelul de flotă are lățime intrinsecă 1069px — nu încape pe
375-412px. Auditul responsive a găsit P0: coloanele ITP/Rovinietă/Tahograf
complet ascunse fără niciun indiciu vizual.

Opțiuni considerate:
(A) Card-uri stivuite pe mobil — sub 768px fiecare vehicul devine card
(B) Coloană sticky + scroll orizontal explicit cu gradient indicator
(C) Coloane prioritizate — mobil arată doar vehicul + cel mai urgent document

Decizie: (A) card-uri stivuite.

De ce: consistent cu poziționarea „interfață simplă" din PRD §1.1;
refolosește componenta de card B2C existentă și testată; adminul de flotă
pe telefon face verificări rapide, nu analiză comparativă — aia se face
la desktop unde tabelul rămâne intact.

Aș reveni dacă: feedback de la admini de flotă reali arată că vor
comparație simultană și pe mobil — atunci varianta C devine candidat.

## D-010 · 2026-08 · Verificare publică: wizard-of-oz manual

Context: Pagina de verificare e promisiunea principală a produsului, dar nu avem încă sursă automată de date (RAR/ASF/CNAIR). Open Question din PRD §7 rămâne nerezolvată.

Opțiuni considerate:
(A) Mock complet cu date fake — arată bine, valoare zero pentru utilizator
(B) Wizard-of-oz manual — utilizatorul cere, adminul completează din surse oficiale
(C) Scraping real cu Playwright — fragil, potențial ilegal, prematur

Decizie: (B) — wizard-of-oz.

De ce: Validăm cererea reală (câți oameni chiar vor verificare?) înainte să investim săptămâni în scraping sau contracte API. Utilizatorii primesc date reale, nu mock. Costul e timpul meu — dar e sub 5 minute per cerere la volume mici.

Aș reveni dacă: Volumul depășește 50 cereri/zi, sau se dovedește că există un API oficial fezabil.

## D-011 · 2026-08 · UX pentru starea de așteptare la verificare

Context: Wizard-of-oz înseamnă că utilizatorul așteaptă până la 24h între cerere și rezultat. Ecranul de așteptare e momentul critic — dacă e prost, utilizatorul pleacă și nu mai revine.

Opțiuni considerate:
(A) Ecran static: „Rezultatul va fi trimis pe email"
(B) Modal de confirmare + link separat + email opțional + pagină de progres cu spinnere care se transformă în semafor final
(C) Progres cu procente false / countdown estimat

Decizie: (B) — modal + link + email opțional + pagină progres cu tranziție vizuală.

De ce: Onestitatea („durează sub 24h") plus continuitatea vizuală (aceeași pagină, doar stări diferite) plus multiplele canale de revenire dă utilizatorului control. Spinnerele care devin semafor sunt satisfăcătoare vizual — momentul e recompensă, nu doar informație. Refuzăm progresul fake pentru că insultă inteligența utilizatorului.

Aș reveni dacă: Feedback real arată că utilizatorii preferă doar email, sau că modal-ul e ignorat.

## D-012 · 2026-08 · PWA: Minimal offline, fără Web Push în Faza 2

Context: Aplicația trebuie să fie instalabilă pe telefon (Android/iOS) fără App Store/Play Store. Trei decizii de scoping luate simultan.

Opțiuni considerate pentru offline support:
(A) Minimal — doar JS/CSS/fonts cached, paginile cer internet
(B) Dashboard cached — utilizatorul vede ultima stare a vehiculelor offline
(C) Full offline — tot ce e posibil cached

Decizie: (A) Minimal.

De ce: Dashboard cached adaugă complexitate tehnică reală (Server Components nu se cacheaza trivial în Next.js App Router, Supabase Auth în Service Worker necesită handling special, cache invalidation la CRUD) fără beneficiu proporțional la MVP. Utilizatorii primari nu sunt în zone fără internet. Date stale în cache pot crea confuzie (ITP „valid" din cache când e de fapt expirat).

Aș reveni dacă: Utilizatori reali cer explicit offline — atunci implementez în Faza 4 cu strategie NetworkFirst + indicator vizual clar „Date din [timestamp]".

Decizie tehnică notabilă: proiectul rulează pe Next 16 cu Turbopack, iar @serwist/next se bazează pe hooks webpack. Soluție: build de producție cu --webpack, development rămâne pe Turbopack. SW generat și verificat în producție.

Web Push amânat pentru imediat după PWA de bază — canalele email + in-app sunt suficiente pentru primii utilizatori.

## D-013 · 2026-08 · Web Push: canal suplimentar, nu înlocuitor email

Context: PWA instalabil e gata (D-012). Web Push permite notificări pe ecran
chiar dacă aplicația e închisă — al treilea canal după in-app și email.

Opțiuni considerate:
(A) Push înlocuiește email — un singur canal activ, cel ales de utilizator
(B) Push e canal suplimentar — email rămâne activ by default, push e bonus
(C) Push cu confirmare de citire oprește email-ul automat

Decizie: (B) — push suplimentar, email neatins.

De ce: Push e efemer (dismiss = dispare pentru totdeauna), poate fi suprimat
de OS, și iOS îl suportă doar prin PWA instalat. Email-ul creează paper trail
(„ți-am trimis alertă pe 15 iulie"). Dacă un utilizator ia amendă pentru că
push-ul a fost suprimat și email-ul era dezactivat, riscul reputațional e real.
Trei canale simultane (in-app permanent, email by default, push opțional) e
strategia cea mai sigură.

Tracking implementat: push_sent_at, push_clicked_at, push_dismissed_at
în notifications_log — pentru analytics, nu pentru a tăia email-uri.

## D-014 · 2026-08 · Panoul de administrare: gestionarea documentelor vehiculelor

Context: Eu, ca administrator al aplicației Zero Amenzi, trebuie să pot adăuga 
și actualiza manual documentele (ITP, RCA, roviniete) pentru vehiculele din 
sistem. În acest MVP, nu avem încă integrări automate cu bazele de date ale 
autorităților (RAR, CEDAM, CNAIR). Deși aplicația are o pagină publică unde 
utilizatorii pot solicita verificarea documentelor unui vehicul, datele efective 
sunt completate manual de către mine, administratorul aplicației, din diferite 
surse oficiale.

Decizii luate:
- Rută nouă `/admin/vehicles/[id]` accesibilă doar la email hardcodat
  (ADMIN_EMAIL). RLS pe vehicles/vehicle_docs extins cu politici admin.
- Modaluri separate de adăugare/actualizare cu select predefinit (RCA/ITP/Rovinietă/Tahograf)
  + opțiune „Alt tip" liberă pentru extensibilitate.
- Link-uri ajutătoare deasupra fiecărei secțiuni: CEDAM (RCA), RAR (ITP),
  CNAIR (roviniete).
- Documente grupate pe tip, RCA/ITP/Rovinietă mereu vizibile (chiar dacă nu
  există încă rânduri), restul tipurilor pe măsură ce apar.

Raționament: Interfață minimalistă pentru o sarcină rară (admin completează
manual sub presiune de timp). Linkurile oficiale accelerează căutarea. Soft-delete
și undo pentru vehicule / șoferi deja existau, nu sunt adăugate aici.

## D-015 · 2026-08 · Notificări pentru cereri de verificare publică

Context: Pagina de verificare permite utilizatorilor anonimi să ceară o verificare
a unui vehicul. Administratorul trebuie notificat imediat, utilizatorul trebuie
să facă tracking la rezultat, și dacă are cont, ar trebui o notificare in-app.

Decizii luate:
- Email admin la fiecare cerere nouă (nu doar la finalizare): link direct la
  `/admin/verifications?request=[id]` pentru a deschide modalul cererii respective.
- Pagina `/verificare/status/[id]` pentru tracking public: plăcuță, dată/oră
  trimitere, status curent, polling la 60 secunde (nu 30, ca să nu fie de-a
  dreptul agresiv) cu stop automat după 24 ore.
- API `/api/verificare/status/[id]` cu cache 30s per instanță (mai scurt decât
  intervalul de polling) + `Cache-Control: private`, ca clientul să nu lovească
  DB-ul repetat.
- Notificare in-app doar dacă utilizatorul era autentificat la cerere: capturăm
  `user_id` la insert. Policy de INSERT pe verification_requests acceptă doar
  `user_id = auth.uid()` sau null — fără asta, anonim putea lega cererea de alt cont.
- Tabela `notifications` separată de `notifications_log` (care servește alertele
  de expirare cu constrângere XOR pe vehicle_doc/driver_cert). Index unic pe
  verification_request_id previne duplicate-uri la retry/dublu-click.

Raționament: Administratorul nu pierde timp căutând cererea în tabel dacă emailul
deschide direct modalul. Utilizatorul anonim nu se pierde după trimitere (linkul
e singurul reper dacă nu a salvat email). Utilizatorul autentificat primește o
notificare care se sincronizează cu pagina de status. Polling-ul e ușor (UUID
neghicibil, fără autentificare necesară, cache scurt) și se oprește automat ca
să nu mai întrebe o cerere care-și pierduse speranța.

Aș reveni dacă: Utilizatorii se plâng că polling e prea activ (baterie / trafic)
— atunci cresc intervalul la 2-3 minute pentru mobile, cu fallback la email. Sau
dacă cer notificări push pentru finalizare — atunci adaug asta ca al patrulea
canal.

## D-016 · 2026-08 · Google OAuth: activat și funcțional

Context: D-anterior amânase configurarea Google OAuth. Acum e configurat complet și funcțional end-to-end pe production.

Configurare făcută:
- Google Cloud Console: proiect nou "Zero Amenzi", OAuth consent screen External
- OAuth Client ID Web application creat cu Authorized redirect URIs:
  * http://localhost:3000/auth/callback
  * https://zero-amenzi.vercel.app/auth/callback
  * https://[project-ref].supabase.co/auth/v1/callback (critic — asta e URI-ul pe care Supabase îl trimite către Google)
- Supabase → Authentication → Providers → Google: enabled cu Client ID + Secret

Probleme întâlnite și rezolvate:

1. Eroare "redirect_uri_mismatch" la primul test
- Cauza: URI-ul Supabase callback nu era în allow-list-ul Google Cloud Console
- Confuzie tehnică clarificată: redirectTo (parametrul din cod, aplicație → Supabase) și redirect_uri (parametrul Supabase → Google) sunt lucruri diferite. Aplicația nu trimite niciodată redirect_uri către Google — îl generează serverul Supabase din propriul project URL.
- Fix: adăugare exactă a https://[project-ref].supabase.co/auth/v1/callback în Authorized redirect URIs în Google Cloud Console

2. Eroare "ERR_CONNECTION_REFUSED" pe localhost după autentificare Google reușită
- Cauza: Supabase Site URL era setat pe http://localhost:3000. Google autentifica corect utilizatorul, Supabase primea token-ul, dar apoi trimitea utilizatorul înapoi pe localhost (care nu răspundea din production)
- Simptom: URL-ul arăta "localhost:3000/?code=..." — deci fluxul funcționase, doar destinația finală era greșită
- Fix în Supabase → Authentication → URL Configuration:
  * Site URL schimbat din http://localhost:3000 în https://zero-amenzi.vercel.app
  * Redirect URLs adăugate cu wildcard pentru ambele medii:
    - http://localhost:3000/** (pentru testare locală)
    - https://zero-amenzi.vercel.app/** (pentru production)
  * Wildcard /** permite orice pagină de destinație după login, nu doar o rută fixă

3. Bug în cod prins și reparat separat
- signInWithOAuth returna {error} care era ignorat — dacă providerul nu era configurat, butonul Google rămânea disabled permanent, zero feedback pentru utilizator
- Fix: afișare eroare + deblocare buton la eșec

Aș reveni dacă:
- Trebuie să trec aplicația din testing în production Google (necesită Google verification pentru public app, altfel utilizatorii văd "unverified app")

## D-017 · 2026-08 · Push notifications și PWA install doar pe mobile

Context: Ambele feature-uri (Web Push și PWA install) au valoare reală doar 
pe telefon, unde utilizatorul are dispozitivul aproape toată ziua și așteaptă 
comportament tip aplicație. Pe desktop, ambele confuzează mai mult decât ajută.

Decizii:
- PushOnboarding: afișat doar pe max-width: 768px
- InstallBanner: afișat doar pe max-width: 768px

De ce Push doar pe mobile: Zero Amenzi e o aplicație pentru urgențe rare 
(expirare acte). Push pe desktop are rată mică de conversie și high friction 
(permisiune de browser, monitor departe).

De ce PWA install doar pe mobile: Pe mobile, PWA adaugă iconița pe home screen 
— utilizatorul obține o "aplicație" reală, comportament așteptat. Pe desktop, 
PWA deschide aplicația într-o fereastră "app-like" fără browser chrome — 
utilizatorii se așteaptă la browser normal și fereastra separată pare 
un bug, nu un feature.

Efect secundar acceptat: InstallBanner nu apare nici pe landing page desktop — 
poarta e în componentă, nu la punctul de montare. Decizie conștientă: 
motivul (fereastra PWA fără chrome de browser pare un bug, nu un feature) 
se aplică identic vizitatorului de pe landing, nu doar utilizatorului din dashboard.

Aș reveni dacă: Utilizatorii cer explicit PWA install pe desktop pentru 
acces rapid separat de tab-uri de browser.

## D-018 · 2026-09 · Cron verification-digest mutat pe GitHub Actions

Context: Vercel Hobby permite cron-uri doar o dată pe zi.
verification-digest la */15 * * * * bloca toate deploy-urile.

Decizie: GitHub Actions apelează ruta /api/cron/verification-digest
la fiecare 15 minute cu CRON_SECRET. Ruta rămâne neschimbată.
check-expiries rămâne pe Vercel (zilnic, 08:00 UTC).

De ce: GitHub Actions e gratuit, fără limită de frecvență,
și nu blochează deploy-urile Vercel. Repo-ul e public, deci minutele
de Actions sunt nelimitate — pe un repo privat, 96 de rulări pe zi ar
fi depășit cota gratuită de 2000 minute/lună.

Două detalii de implementare care nu sunt evidente:
- Ruta exportă doar GET. Un POST întoarce 405, iar `curl` fără
  `--fail-with-body` iese cu cod 0 chiar și atunci — workflow-ul ar fi
  apărut verde la fiecare rulare fără să fi trimis vreun digest.
- Cron-urile GitHub rulează „best effort": la ore de vârf pot întârzia
  cu 5-20 de minute, deci spațierea reală e neregulată. Acceptabil
  pentru o notificare fără termen strict.

Aș reveni dacă: Trecem pe Vercel Pro (atunci cronul se mută înapoi în
vercel.json, mai aproape de restul configurației), sau dacă întârzierile
GitHub devin o problemă reală pentru timpul de răspuns către solicitanți.

## D-019 · 2026-09 · Spații unificate și abonamente per vehicul

Context: Aplicația avea două concepte de „cine deține vehicule", modelate
diferit. Flotele erau rânduri reale în `organizations`. Garajul personal nu
exista în baza de date — era un obiect hardcodat în `AppHeader.tsx`, iar
apartenența se deducea din `vehicles.owner_id`. Fiecare acțiune care atingea
vehicule primea un „scop" polimorf, `{ownerId} XOR {orgId}`, și ramifica pe el.

Peste asta trebuia construit un sistem de abonamente care funcționează la
nivelul entității care deține vehiculele — și una dintre cele două entități
nu exista.

Decizii luate:

- **`spaces` înlocuiește `organizations`.** Garajul personal devine un rând
  real, cu `kind='personal'`, creat automat de triggerul de la signup. Flotele
  sunt același tabel, cu `kind='fleet'` și CUI. Toate celelalte tabele
  (`vehicles`, `drivers`, `alert_types`, `memberships`, `notifications_log`)
  se leagă de `space_id`, nu de `owner_id`/`org_id`.
- **Prețul e 12 lei/an per vehicul, fără plafon**, identic pentru persoane
  fizice și firme. S-a renunțat la plafonul de 4 vehicule discutat inițial la
  B2C: la preț egal n-are sens. Firmele mari pot negocia separat.
- **Expirarea are două niveluri independente.** `spaces.subscription_status`
  ține trialul de 1 an; `vehicles.paid_until` ține plata concretă. Regula de
  acces (`src/lib/subscription.ts`) e:
  `(spațiul e trialing și trialul n-a expirat) SAU (paid_until > acum)`.
  Nu e all-or-nothing: dacă trialul expiră și ai plătit 2 din 3 mașini, cele
  două plătite rămân accesibile și doar a treia se blochează — datele
  RCA/ITP/Rovinietă i se ascund.
- **Trialul se leagă de plăcuță, nu de cont.** Tabelul `plate_trials` are
  cheia primară pe plăcuța normalizată, iar un trigger o înregistrează la
  primul vehicul adăugat dintr-un spațiu în trial. Un cont nou cu alt email
  nu mai poate lua încă un an gratuit pentru aceeași mașină.
- **Interfața de plată e agnostică.** `PaymentProvider` (src/lib/payments/)
  definește `createCheckout` și `handleWebhook`; implicit rulează un provider
  care răspunde „not configured". Niciun SDK instalat, nicio cheie, nicio
  presupunere despre Stripe/PayU/Netopia.

De ce contează detaliile astea:

- **Privilegii pe coloane, nu doar RLS.** RLS decide pe ce RÂNDURI scrie
  clientul, nu ce COLOANE. Fără `revoke update (paid_until) on vehicles`,
  orice utilizator autentificat își dădea Premium gratis cu un
  `PATCH /rest/v1/vehicles {"paid_until":"2099-01-01"}` — policy-ul ar fi
  permis, e propriul lui vehicul. La fel pentru `subscription_status` și
  `trial_ends_at` pe spații. Tipurile `Update` din database.types.ts omit
  aceleași coloane, deci și TypeScript respinge scrierea lor; singura excepție
  e `src/lib/payments/grant.ts`, care rulează cu service_role.
- **Regulile sunt impuse de trigger, nu de aplicație.** Cheia anon e publică,
  deci un POST direct la REST ocolește tot codul. Triggerul
  `enforce_vehicle_subscription_rules` respinge inserturile în spații expirate
  și plăcuțele care și-au consumat trialul, indiferent pe unde vin.
- **Mock-ul de plată nu simulează succes.** Un mock care „reușește" ar acorda
  Premium oricui apasă butonul, iar ajuns din greșeală în producție n-ar fi
  observat până la verificarea încasărilor.

Consecințe acceptate:

- Mașina vândută nu mai primește trial. Noul proprietar vede „acest vehicul a
  beneficiat deja de perioada gratuită" și trebuie să plătească. E prețul
  legării trialului de plăcuță — respinge și un caz legitim.
- `normalize_plate` există în două locuri, SQL și TypeScript, ținute sincron
  manual. Postgres nu poate importa funcția din TS, iar cerința de constrângere
  la nivel de DB nu se putea satisface altfel.
- Migrarea 20260917100000 e distructivă: șterge `organizations` și recreează 8
  tabele. Sigură doar pentru că baza era goală la momentul aplicării.

Aș reveni dacă: Apare nevoia de roluri mai fine în flotă (azi owner/admin/member
e moștenit din `memberships` fără să fie folosit diferențiat), sau dacă
abonamentul trebuie să devină per-spațiu cu preț de volum în loc de per-vehicul
— ambele ar cere revenit la modelul de facturare, nu la structura spațiilor.

## D-020 · 2026-09 · Incident: signup rupt — triggerul on_auth_user_created lipsea din producție

Context: Imediat după push-ul la D-019, login-ul a picat complet pe
producție (`/app/garage` crăpa la încărcare). Asumpția „baza e goală" din
D-019 (vezi consecințele de mai sus) era greșită — existau deja 2 conturi
în `auth.users`.

Cauza reală, descoperită prin interogare directă a bazei: `public.users`
avea 0 rânduri, deși `auth.users` avea 2. Triggerul `on_auth_user_created`
(creat inițial în 20260720143336_functions.sql) lipsea complet din
producție — niciun cod din istoricul migrațiilor nu-l dropează explicit, deci
a fost șters manual la un moment dat, în afara fluxului de migrare (drift
netrackuit). D-019 făcuse `create or replace function handle_new_user()`,
ceea ce actualizează corpul funcției, dar nu recreează legătura trigger →
funcție dacă triggerul nu mai există.

Efect: niciun signup, vechi sau nou, nu mai popula `public.users` sau
`public.spaces`. `/app/garage` redirecta userii fără spațiu spre
`/app/organizations/new`, iar în plus un service worker vechi din cache
(D-012) agrava simptomul — pagina crăpa la nivel de browser înainte să
apuce să redirecteze (confirmat: mergea corect în incognito).

Fix aplicat (migrația 20260917160000):

1. Recreat `on_auth_user_created` pe `auth.users` → `handle_new_user()`.
2. Backfill `public.users` din `auth.users` pentru conturile scăpate.
3. Backfill `public.spaces` (kind='personal') pentru userii de la pasul 2 —
   triggerul `on_space_created` creează automat membership-ul aferent.

De ce nu am revenit la migrarea distructivă din D-019: efectul deja produs
(tabelele vechi șterse) era ireversibil și fără pierdere reală, pentru că
nu existau vehicule/șoferi în ele — doar cele 2 conturi trebuiau reparate.

Aș reveni dacă: Se mai găsește drift necunoscut între migrațiile din
`supabase/migrations/` și starea reală de producție — semn că schimbări au
fost făcute direct din SQL Editor fără migrație. În acel caz, rulez
`supabase db diff --linked` înainte de orice migrație majoră ca să prind
diferențele înainte, nu după deploy.

## D-021 · 2026-09 · CSP implementat în Report-Only

Context: Content Security Policy reduce impactul unui XSS prin restricționarea
resurselor pe care browserul le poate încărca. Până acum `next.config.ts` avea
doar Referrer-Policy, X-Content-Type-Options și X-Frame-Options, cu un
comentariu care amâna CSP-ul de frica ruperii paginii de admin și a emailurilor.

Decizie: Report-Only în prima fază — browserul raportează ce ar bloca fără să
blocheze efectiv. Politica e construită ca obiect în `next.config.ts` și
serializată într-un singur header, ca să fie citibilă și modificabilă pe
directivă.

Directive implementate:
`default-src 'self'`, `script-src`, `style-src`, `font-src`, `connect-src`,
`img-src`, `worker-src`, `manifest-src`, `object-src 'none'`, `base-uri 'self'`,
`form-action 'self'`, `frame-ancestors 'none'`.

Resurse externe permise — doar Supabase:
- `https://*.supabase.co` în connect-src — REST și Auth, apelate din browser.
- `wss://*.supabase.co` în connect-src — realtime. Momentan nu folosim niciun
  `.channel()`, dar clientul poate deschide socketul, iar wildcard-ul pe același
  serviciu nu lărgește suprafața de atac.

Auditul a arătat mai puține dependențe externe decât ne așteptam:
- **Fonturile nu au nevoie de domeniu extern.** `next/font/google` în
  `src/app/layout.tsx` descarcă Archivo și Inter la build și le servește de pe
  origine proprie. `fonts.googleapis.com` apare doar în `src/prototypes/`, care
  nu intră în bundle. Deci fără `fonts.gstatic.com` în politică.
- **Endpointurile de push NU trebuie în connect-src.** `fcm.googleapis.com`,
  `updates.push.services.mozilla.com` și `web.push.apple.com` sunt contactate
  fie de browser intern la `pushManager.subscribe()`, fie de serverul nostru
  prin `web-push` — niciuna dintre căi nu trece prin CSP-ul paginii.
- **Emailurile nu erau niciodată o problemă.** HTML-ul din `src/lib/email/` e
  randat în clientul de email al destinatarului, nu în browserul nostru. Frica
  din comentariul vechi era nefondată pe jumătate.
- Niciun script extern, niciun CDN, zero `dangerouslySetInnerHTML` în codul de
  producție.

Next.js necesită unsafe-inline/unsafe-eval: **DA pentru ambele tipuri, parțial.**
- `script-src` are nevoie de `'unsafe-inline'`. Verificat pe build: HTML-ul
  generat conține 4 tag-uri `<script>` inline cu payload-ul de hidratare
  (`self.__next_f.push(...)`). Fiind un header static, nu per-request, nu putem
  emite nonce, deci nu există alternativă în abordarea asta.
- `style-src` are nevoie de `'unsafe-inline'` — Tailwind v4, `motion` și
  next/font injectează stiluri inline, plus trei atribute `style={{}}` în
  `VerificationForm.tsx` și `AddVehicleModal.tsx`.
- `'unsafe-eval'` e adăugat **doar în dev**, pentru HMR. Confirmat absent din
  headerul de producție.

Ce înseamnă asta onest: cu `script-src 'unsafe-inline'`, CSP-ul apără împotriva
încărcării de script din *surse externe*, dar nu oprește un XSS inline. Câștigul
real e în `object-src 'none'`, `base-uri`, `form-action` și `frame-ancestors`.
Protecția completă contra XSS cere nonce generat în middleware, ceea ce forțează
randare dinamică pe toate rutele și ar strica optimizarea statică a paginilor SEO
(`/`, `/verificare`, `/termeni`, `/politica-confidentialitate`) — amânat
deliberat, nu uitat.

Pasul următor: după o săptămână în producție fără rapoarte de blocare legitimă,
`Content-Security-Policy-Report-Only` devine `Content-Security-Policy`. Momentan
nu avem `report-uri`/`report-to` configurat, deci violările se văd doar în
consola browserului — pentru colectare agregată ar trebui adăugat un endpoint.

Aș reveni dacă: Adăugăm un script extern (analytics, widget de plată) — atunci
connect-src și script-src trebuie extinse explicit, nu lărgite cu wildcard. Sau
dacă trecem pe nonce, moment în care `'unsafe-inline'` din script-src dispare și
CSP-ul devine o apărare reală contra XSS.

## D-022 · 2026-09 · RLS hardening post-audit

Context: audit complet al politicilor RLS pe cele șapte categorii (SELECT
nelimitat, escaladare de privilegii, cross-tenant, bypass admin, INSERT/UPDATE
nerestricționat, DELETE, service_role). Izolarea între spații s-a dovedit
solidă — nicio cale de acces cross-tenant la vehicule, documente sau spații.
Restul constatărilor sunt reparate aici.

6 probleme găsite și reparate:

1. **CRON_SECRET missing guard (critic — rută deschisă).** Comparația
   `authHeader !== \`Bearer ${process.env.CRON_SECRET}\`` devenea, cu variabila
   nesetată, o comparație cu literalul `"Bearer undefined"`. Oricine trimitea
   exact acel header declanșa cronul de alerte, consumând cota Resend de 100
   email-uri/zi — DoS pe canalul de notificări, fără cont, de la orice IP.
   Ambele rute de cron resping acum cu 503 dacă secretul lipsește.

2. **users.email revoke update.** `users_update_own` permitea UPDATE pe orice
   coloană a rândului propriu, iar check-expiries citește destinatarul din
   `public.users.email` — deci un utilizator putea pune adresa unui terț și
   folosi contul nostru Resend ca să trimită acolo.

3. **notifications_log restricționat la read_at + push_clicked_at /
   push_dismissed_at.** Înainte, orice membru putea rescrie `email_sent_at`,
   `push_sent_at`, `sent_at` sau `doc_type`, adică să-și falsifice istoricul de
   alerte. Cele două coloane de push rămân scriibile deliberat: rutele
   /api/push/clicked și /api/push/dismissed le scriu cu clientul autentificat
   al userului, nu cu service_role.

4. **memberships delete — ownerul nu poate fi scos.** Un admin de flotă putea
   șterge membership-ul ownerului, care pierdea `is_space_member` și rămânea
   blocat în afara propriei flote. Preluarea nu era posibilă (autoritatea stă
   în `spaces.owner_id`, cu UPDATE revocat), doar blocarea.

5. **plate rename — verificare trial la UPDATE.** Triggerul verifica
   `plate_trials` doar la INSERT. Adăugai plăcuța A (consumând trialul lui A),
   o redenumeai în B, și obțineai acoperire gratuită pe B fără ca B să fie
   marcată ca folosită. Triggerul de UPDATE verifică acum și consumă plăcuța
   nouă; pe cea veche NU o eliberează, altfel redenumirea în cerc ar da trial
   nelimitat.

6. **Policy-uri admin recreate pe vehicles/vehicle_docs.** Create în
   20260817120000, pierdute când 20260917100000 a făcut `drop table ... cascade`
   pe ambele tabele. Panoul /admin/vehicles/[id] primea null pentru vehiculul
   altui utilizator și cădea pe notFound(). Eșua închis, deci nu era breșă —
   dar era rupt. Recreate exact cele patru originale, deliberat fără UPDATE pe
   vehicles: nicio rută de admin nu modifică vehiculul în sine.

Bonus: rate limit 240/oră per IP pe `/api/verificare/status/[id]`, ruta publică
citită cu service_role. Plafonul e calibrat pe polling-ul real (60s interval,
până la 24h ⇒ ~60 cereri/oră per tab), cu loc pentru câteva taburi sau mai
mulți utilizatori în spatele aceluiași CGNAT.

**Descoperire colaterală, mai importantă decât oricare fix de mai sus:
`revoke update (coloană)` e probabil fără efect pe acest proiect.** În Postgres
privilegiile de tabel și de coloană sunt straturi independente, iar un UPDATE
trece dacă rolul are dreptul la nivel de tabel SAU pe coloană. Nu există grant
negativ. Supabase acordă implicit `grant all on all tables in schema public`
pentru anon și authenticated — deci revoke-urile pe coloane din 20260917100000,
descrise acolo drept „partea care face abonamentul să nu poată fi falsificat",
nu scad nimic din grantul de tabel. Toate restricțiile de coloană sunt rescrise
aici ca allow-list (revoke pe tabel, apoi grant explicit pe coloanele permise),
formă corectă în ambele interpretări. N-am putut confirma pe o bază reală
(fără Docker local) — de verificat cu interogarea din capul migrației.

În plus, nimic nu restrângea INSERT-ul pe `vehicles.paid_until`: policy-ul
`vehicles_insert_admin` cere doar să fii admin al spațiului, deci se putea crea
un vehicul cu `paid_until = '2099-01-01'` direct pe REST și obține Premium pe
viață. Gaură independentă de discuția de mai sus, închisă de allow-list-ul de
INSERT.

Aș reveni dacă: Apare nevoia ca adminul să modifice vehicule, nu doar
documentele lor — atunci se adaugă explicit `vehicles_update_admin`, nu se
lărgește policy-ul de select. Sau dacă rolul de admin depășește un singur
email hardcodat (acum duplicat în trei locuri: ADMIN_EMAIL plus două migrații),
moment în care merită o coloană de rol pe users și un helper SECURITY DEFINER.

## D-023 · 2026-09 · Vehiculele din garaj trec prin fluxul de verificare

Context: La adăugarea unui vehicul, `addVehicleAction` insera trei documente
cu date inventate din offset-uri fixe (ITP +280 zile, RCA +150, Rovinietă
+210) și le afișa ca fapt: buline verzi, „Toate documentele sunt în regulă".
Nimeni nu verifica nimic, nimeni nu era anunțat. Un utilizator real ar fi
plecat convins că RCA-ul îi e valabil până în februarie — exact afirmația
falsă despre un act legal pe care produsul promite s-o prevină. Descoperit
când un test cu o plăcuță fictivă n-a produs niciun email de verificare.

Decizie: Nu se mai inventează nicio dată. Adăugarea unui vehicul creează o
`verification_request` legată prin `vehicle_id`, cu emailul contului atașat.
Cererea intră în digestul adminului ca oricare alta; la completare, rezultatul
se scrie în `vehicle_docs` (service_role, upsert pe tip), utilizatorul primește
email + notificare in-app cu link direct la garaj/flotă. Până atunci cardul
arată „În verificare" pe fiecare document, nu liniuță și nu verde.

Reutilizează tot ce exista deja din D-010/D-011 — același tabel, același
digest, același panou admin, aceeași acțiune de completare. Singura piesă
nouă e legătura cerere → vehicul și policy-ul care lasă membrii spațiului să
vadă starea ei.

Detalii care nu sunt evidente:
- Policy-ul de INSERT cere `is_space_admin` pe vehiculul legat. Fără asta,
  oricine ar putea atașa o cerere vehiculului altcuiva și, la completare, i-ar
  suprascrie documentele.
- Policy-ul nou de SELECT e scoped pe `vehicle_id` + membru al spațiului.
  Nu deschide listarea cererilor publice (fără cont), care rămâne admin-only.
- `nu_gasit` sau lipsa datei nu produc niciun document — rămâne liniuță.
  O liniuță e onestă; o dată inventată e exact ce eliminăm.
- Limita de plăcuță pe cereri a crescut de la 15 la 32: flotele B2B au
  camioane cu numere străine, iar cererea lor ar fi picat pe constrângere.
- Dacă inserarea cererii eșuează, vehiculul rămâne și cardul arată liniuțe,
  nu „în verificare" — ca să nu promită ceva ce nu s-a înregistrat.

Aș reveni dacă: Apar integrările automate cu RAR/ASF/CNAIR (D-010). Atunci
completarea cererii o face un job, nu adminul, dar cardul, notificarea și
scrierea în `vehicle_docs` rămân identice — fluxul e deja agnostic la cine
completează.

## D-024 · 2026-09 · Trialul acoperă un singur vehicul

Context: D-019 stabilise „trial de 1 an per spațiu, vehicule nelimitate", cu
monetizarea pe timp: după un an, 12 lei/an per vehicul. În practică asta
însemna că un utilizator cu o flotă de 20 de mașini le ținea pe toate gratuit
timp de un an — exact clientul de la care venea cea mai mare valoare plătea
zero cel mai mult timp. Verificarea actelor costă muncă manuală per vehicul
(wizard-of-oz, D-010/D-023), deci costul nostru creștea liniar cu numărul de
vehicule, iar venitul din trial rămânea zero.

Decizie (INVERSEAZĂ parțial D-019): perioada gratuită acoperă **un singur
vehicul**, identic la B2C și B2B. Al doilea vehicul se plătește imediat,
indiferent cât a mai rămas din trial. După primul an se plătește pentru toate.
Plafonul e pe trial, nu pe mărimea garajului: un vehicul plătit nu intră în
numărătoare, deci cine plătește nu e penalizat.

Ce se numără, și de ce contează fiecare detaliu:
- **Vehiculele NEPLĂTITE** (`paid_until is null or paid_until <= now()`).
  Plafonul e pe trial; plata iese din el.
- **Inclusiv cele soft-deleted** (`deleted_at` setat). Trialul se consumă la
  adăugare și nu se eliberează prin ștergere — altfel ciclul
  adaugă/șterge/adaugă ar da vehicule gratuite la infinit. E o a doua barieră,
  peste `plate_trials`, care leagă trialul de plăcuță: aceea oprește reluarea
  pe alt cont, asta oprește reluarea pe același cont.
- **Doar când spațiul e `trialing`.** Un spațiu `active` (a plătit o dată)
  poate adăuga oricâte: fără `paid_until` propriu, `vehicleAccess` le întoarce
  `locked`, deci datele RCA/ITP/Rovinietă le sunt ascunse. Nu e acces gratuit,
  e doar un vehicul care așteaptă plata.

Aplicat în trei locuri, DB-ul fiind autoritatea:
1. `enforce_vehicle_subscription_rules` (migrarea 20260918150000) — ridică
   `trial_vehicle_limit`. Prinde și un POST direct pe REST cu cheia anon.
2. `canAddVehicle(space, unpaidVehicleCount)` — semnătură schimbată, pentru
   mesajul clar din interfață înainte de insert.
3. `AddVehicleModal` — când e blocat arată upsell în loc de formular. Nu are
   rost să lași omul să completeze ca să afle la submit că e blocat.

CONDIȚIE DE CURSĂ, acceptată deliberat: `count(*)` într-un trigger BEFORE
INSERT nu e atomic, deci două inserturi simultane pot vedea ambele zero și
trece amândouă. Consecința maximă e un vehicul gratuit în plus, pe un spațiu,
o singură dată. Alternativa curată — index unic parțial pe (space_id) where
paid_until is null — ar fi interzis și vehiculele neplătite din spațiile
'active', care sunt legitime. Nu merită complexitatea.

LIMITARE CUNOSCUTĂ, asumată la activare: butonul „Trece la Premium" din upsell
e dezactivat, fiindcă `PaymentProvider` e încă `not-configured` (D-019).
Practic, un utilizator ajuns la plafon nu are nicio cale automată de a
continua — textul îi spune să ne scrie pentru activare manuală. Blocajul a
fost activat conștient înaintea procesatorului, ca regula să fie în vigoare de
la primii utilizatori, nu retroactiv.

Vehiculele existente nu sunt afectate: triggerul rulează doar la INSERT, deci
spațiile care au deja mai multe vehicule în trial le păstrează.

Aș reveni dacă: Se conectează procesatorul de plată — atunci butonul din
upsell trebuie legat de un flux care permite plata pentru un vehicul care nu
există încă (azi `startUpgradeAction` cere `vehicleIds` existente, deci
singura cale e să plătești vehiculul curent, ceea ce trece spațiul pe
'active' și ridică plafonul). Sau dacă plafonul de 1 se dovedește prea agresiv
la B2B, caz în care devine o coloană pe `spaces`, nu o constantă în cod.

## D-025 · 2026-09 · Pagina de setări cont

Context: `/app/settings` avea o singură secțiune, preferințele de notificare.
Nu exista nicio cale de a schimba emailul, de a ieși de pe alte dispozitive
sau de a șterge contul — iar politica de confidențialitate promite dreptul de
ștergere (GDPR art. 17), pe care îl puteai exercita doar scriindu-ne.

Decizie: pagina are patru secțiuni — Cont (nume, email), Alerte (ce exista),
Abonamente (starea per vehicul), Securitate (deconectare globală, ștergere).
Am lăsat deliberat afară ce nu există în produs: PIN, SMS, limbă, mod
întunecat, plată recurentă, telefon. Un comutator care nu face nimic e mai
rău decât lipsa lui.

Detalii care nu sunt evidente:
- **Schimbarea emailului cerea o migrație.** `handle_new_user` copia emailul
  în `public.users` doar la INSERT. După o schimbare prin Supabase Auth,
  oglinda rămânea pe adresa veche, iar alertele pleacă de acolo — funcția ar
  fi părut reușită și n-ar fi schimbat nimic. Triggerul
  `on_auth_user_email_changed` (20260922100000) sincronizează la confirmare.
  Adresa nu se schimbă la apăsarea butonului, ci la confirmarea din email.
- **Numele stă în `user_metadata.full_name`**, nu într-o coloană: Google îl
  completează deja acolo, deci o singură sursă, fără migrație.
- **Ștergerea folosește cascadele existente.** Dispar: users, spațiul
  personal, flotele deținute (inclusiv pentru ceilalți membri — pagina le
  numește înainte de confirmare), vehicule, documente, push, notificări.
- **Ce rămâne, deliberat:** `plate_trials` păstrează plăcuța ca trial
  consumat (`first_space_id` devine null). Altfel ștergerea contului ar fi o
  cale de a relua anul gratuit pentru aceeași mașină. Emailul de pe cererile
  publice de verificare se golește explicit înainte de ștergere, fiindcă după
  ea `user_id` devine null și nu mai știm care erau ale omului.
- **Confirmarea acceptă și „STERGE"** fără diacritice: pe o tastatură de
  telefon fără română, „Ș" e o barieră de tastatură, nu de intenție.
- **Callback-ul de auth acceptă `next`**, dar doar căi din `/app/`, ca să nu
  devină open redirect.
- Abonamentele arată starea curentă, nu un istoric: nu există tabel de plăți.

Testat pe un cont de unică folosință creat prin API-ul de admin: signup
(users + spațiu personal + membership owner), schimbare email (sincronizată
în public.users), ștergere (toate rândurile dispar).

Aș reveni dacă: Se conectează procesatorul de plată — atunci Abonamentele
primesc istoric real. Sau dacă apare nevoia de a lista sesiunile active pe
dispozitive; Supabase nu le expune, deci ar trebui un tabel propriu.

## D-026 · 2026-09 · Cardul din garaj înlocuiește fereastra de detalii

Context: După ce cardul și fereastra „Detalii vehicul" au ajuns să folosească
aceeași listă de documente, fereastra repeta exact conținutul cardului, cu
un click în plus.

Decizie: În garaj, fereastra dispare. Totul se face pe card: documentele cu
data completă, alertele suplimentare (adăugare pe loc, ștergere cu ✕), iar
restul într-un meniu ⚙: „Am reînnoit un act — verifică din nou", „Premium
pentru acest vehicul" și „Șterge vehiculul" (cu confirmare și anulare 30s).
Eticheta „Acțiune necesară" / „Expiră curând" a dispărut: chenarul colorat
al cardului spune același lucru.

„Verifică din nou" rezolvă o gaură reală: datele unui vehicul se schimbă doar
printr-o verificare, deci un RCA reînnoit în altă parte rămânea „Expirat"
pentru totdeauna. Opțiunea creează o cerere nouă pe fluxul din D-023 (una
singură în curs per vehicul); la completare rezultatul suprascrie documentele.

În flote fereastra rămâne: tabelul de pe desktop n-are unde afișa alertele,
adăugarea sau ștergerea, deci rândul deschide în continuare detaliile.

Nu am pus în meniu editarea plăcuței sau a VIN-ului: schimbarea plăcuței e
legată de regula de trial (D-024), iar o greșeală de tastare se rezolvă prin
ștergere și re-adăugare.

## D-027 · 2026-09 · Panoul de admin arată baza de date pe utilizator

Context: Panoul de admin avea o singură pagină, coada de cereri de verificare.
Nu exista nicio cale de a vedea clienții — cine s-a înregistrat, ce spații și
vehicule are, dacă alertele îi sunt pornite — decât interogând direct baza.

Decizie: Panoul primește tab-uri („Cereri de verificare", „Utilizatori"), un
tabel cu toate conturile și o pagină de detaliu per cont. Citirea se face cu
service_role, nu prin RLS: altfel ar fi trebuit să deschid fiecare tabel către
emailul de admin, ceea ce lărgește și ce poate citi aplicația obișnuită.

Pentru că service_role ocolește complet RLS, garda a fost mutată într-un
singur loc (`requireAdmin`, apelat din layout-ul /admin) în loc să fie copiată
în fiecare pagină: o verificare uitată ar expune toată baza. Paginile de admin
primesc și `noindex`.

Ce NU se afișează: cheile de criptare ale abonamentelor push (secrete, inutile
pe ecran) — doar host-ul serviciului și data.

Numărătorile se fac în memorie, din câteva interogări. La zeci de rânduri e
mai simplu decât agregări în DB; de la câteva mii de conturi merită paginare.

Panoul e deocamdată doar de citit. Prima acțiune care merită adăugată e
activarea manuală de Premium: cu plafonul din D-024 și fără procesator de
plată, cine lovește limita n-are altă cale decât să scrie, iar activarea se
face acum direct din baza de date.

## D-028 · 2026-09 · Trei cauze de navigare lentă, reparate

Context: audit cerut pe performanța de navigare între pagini — dimensiuni de
bundle, loading states, cache pe interogări Supabase, componente reîncărcate
inutil. Raportul (fără modificări) a găsit trei cauze concrete, verificate
pe artefactele de build, nu presupuse.

**1. Interogări secvențiale în loc de paralele.** `/app/garage` și
`/app/fleet/[spaceId]` făceau 6, respectiv 9 apeluri Supabase unul după altul,
deși jumătate erau independente între ele (ex. `unpaidVehicleCount` nu
depinde de `vehicleRows`; `drivers` și `alertTypes` nu depind de nimic din
lanțul de vehicule). Rescrise cu `Promise.all`, grupate pe valuri de
dependență reală: 9 apeluri secvențiale devin 4 valuri paralele pe pagina de
flotă. Patternul exista deja corect în `/app/settings` — doar nefolosit
consecvent. Contează mai mult decât ar părea: Supabase e în `eu-west-2`, iar
Vercel nu are regiune fixată în `vercel.json`, deci fiecare apel secvențial
plătește probabil o latență de rețea mare, nu una locală.

**2. Zero `loading.tsx` în tot proiectul.** Fără el, browserul stă pe ecranul
vechi până se rezolvă *tot* lanțul de interogări — o pauză fără niciun semnal
pare un blocaj, nu o încărcare. Adăugate patru: `/app/garage`,
`/app/fleet/[spaceId]`, `/app/settings`, `/admin` (ăsta din urmă stă direct
în `src/app/admin/`, nu într-un subdirector, ca `layout.tsx` — deci tab-urile
— să rămână vizibile în timp ce se încarcă doar conținutul). Un singur
`Skeleton.tsx` reutilizabil, dimensiuni calibrate pe structura reală a
fiecărui ecran, ca apariția conținutului adevărat să nu sară layoutul.

**3. `framer-motion` (~120 KB) încărcat pe landing și pe `/verificare` doar
pentru un modal de succes.** `VerificationForm` → `Modal` → `motion/react`,
sincron, pe cele mai vizitate pagini publice, pentru un ecran pe care
majoritatea vizitatorilor nu-l ating la prima vizită. Extras
`VerificationStartedModal` într-un fișier propriu, încărcat cu
`next/dynamic({ ssr: false })` — apare doar după trimiterea reușită a
formularului. Verificat pe build real: landing și `/verificare` au scăzut de
la 589 KB la 471 KB JS, iar motion nu mai apare în niciun script încărcat la
prima vizită.

Aș reveni dacă: Apar și alte pagini publice cu formulare-modal similare —
atunci merită un pattern reutilizabil de „modal lazy", nu o extragere
punctuală de fiecare dată. Sau dacă se fixează o regiune Vercel apropiată de
`eu-west-2` — atunci ipoteza despre latența transatlantică ar trebui
reverificată cu măsurători reale (Vercel Analytics / PageSpeed Insights),
nu doar dedusă din numărul de round-trip-uri.

## D-029 · 2026-09 · Funcțiile rulau în Washington, baza de date la Londra

Context: după D-028 (paralelizare + loading states) navigarea tot se simțea
lentă. Măsurat pe producție în loc de presupus: `X-Vercel-Id` întorcea
`fra1::iad1` pe toate rutele dinamice — cererea intra prin edge-ul din
Frankfurt, dar funcțiile serverless executau în Washington DC, în timp ce
Supabase e în `eu-west-2` (Londra). Fiecare interogare traversa Atlanticul.

Capcană de măsurare, meritată de notat: prima verificare s-a făcut pe landing,
care e static și servit din cache (`X-Vercel-Cache: HIT`, doar `fra1::`), deci
părea că totul e în Europa. Abia o rută dinamică, necache-uită, arată unde
rulează efectiv codul. Am tras concluzia greșită o dată exact din acest motiv.

Decizie: `regions: ["lhr1"]` în vercel.json — aceeași zonă cu baza de date.

Măsurat, `/login`, mediana din 12 cereri: **271ms → 184ms**. Scăzând latența
proprie până la Frankfurt (~140ms, măsurată pe pagini statice din cache),
partea de server a scăzut de la ~130ms la ~44ms, adică de aproape trei ori.
Câștigul crește cu numărul de interogări per pagină: `/login` face două
apeluri de autentificare, `/app/garage` face șase valuri.

În plus, matcher-ul de middleware excludea doar imagini, deci `sw.js`,
`manifest.json`, `robots.txt`, `llms.txt`, `sitemap.xml` și `offline.html`
declanșau fiecare un `getUser()` către Supabase — un drum în rețea pentru un
fișier static. `sw.js` și `manifest.json` la fiecare încărcare de PWA,
`robots`/`sitemap` la fiecare crawler. Lista de extensii e acum largă.

Ce rămâne, măsurat dar nereparat: **cold start**. Prima cerere după o perioadă
de inactivitate a durat 0,84s față de ~0,20s la cald. Pe Vercel Hobby
funcțiile adorm, iar utilizatorul care revine după o pauză plătește exact
diferența asta — probabil o parte din senzația de „merge greu". Se atenuează
cu Fluid Compute (setare de proiect în dashboard) sau cu un plan plătit, nu
din cod.

Aș reveni dacă: Se mută baza de date în altă regiune — atunci `regions` din
vercel.json trebuie mutat odată cu ea, altfel reapare exact aceeași problemă,
tăcut. Sau dacă apar utilizatori în afara Europei, caz în care merită
comparat câștigul unei singure regiuni lângă DB cu cel al mai multor regiuni
(disponibil doar pe planurile plătite).
