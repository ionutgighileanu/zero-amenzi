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
