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
