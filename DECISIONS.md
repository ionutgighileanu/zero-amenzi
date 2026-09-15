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
