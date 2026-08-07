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
