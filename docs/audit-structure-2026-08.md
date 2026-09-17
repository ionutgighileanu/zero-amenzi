# Audit structură fișiere — 2026-08-10

Scop: verificare că fiecare tip de fișier conține doar limbajul potrivit lui (fără amestec de responsabilități). Sfera auditului: `src/`, config-uri de root, `supabase/migrations/` — exclus `node_modules`, `.next`, `.git` și directoarele de skill-uri (`.agents/`, `.claude-code/`, `.impeccable/`), care nu fac parte din codul proiectului.

Nu am reparat nimic — doar raportez, cum ai cerut.

## 1. Distribuția de fișiere

| Extensie | Nr. fișiere | Linii totale | Observații |
|---|---|---|---|
| `.tsx` | 43 | 4.174 | Toate în `src/app/` și `src/components/` |
| `.ts` | 28 | 1.487 | Include `database.types.ts` (311 linii, tipuri generate manual) |
| `.css` | 1 | 44 | Doar `src/app/globals.css` — proiectul nu folosește deloc CSS Modules (`.module.css`: 0 fișiere) |
| `.json` | 5 | — | `package.json`, `package-lock.json`, `tsconfig.json`, `vercel.json`, `skills-lock.json` |
| `.sql` | 5 | 538 | Toate în `supabase/migrations/` |

## 2. Rezultate pe categorie

| Categorie | Ce am verificat | Rezultat |
|---|---|---|
| `.tsx` — CSS inline masiv | Am numărat toate aparițiile `style={{...}}` (28, în 14 fișiere) și am verificat dacă vreuna are mai multe proprietăți (ex. `style={{ a: x, b: y }}`) | **Fără încălcări.** Toate cele 28 sunt cu o singură proprietate — `backgroundColor`/`color` legate de constanta JS `BRAND_BLUE` (culoarea brandului, `#003399`, aplicată acolo unde Tailwind n-o poate exprima static fără o extensie de config) sau `textTransform: "uppercase"` (2 apariții). Zero obiecte de stil cu mai multe proprietăți. |
| `.tsx` — CSS-in-JS | Verificat `package.json` pentru styled-components/emotion/stitches/vanilla-extract | **Niciuna instalată.** Proiectul e Tailwind-only + inline style minimal pentru valori dinamice. |
| `.css` — JS în fișier CSS | Citit integral `globals.css` (44 linii) | **Curat.** Directive Tailwind v4 (`@import`, `@theme`), custom properties CSS, media queries. Zero JS. |
| `.ts` — JSX | Căutat sintaxă JSX reală (`</tag>`, `/>`, `<Tag prop=`) în toate cele 28 fișiere `.ts` | **Zero fișiere cu JSX real.** |
| `.ts` — HTML în string literals | Aceeași căutare a prins și HTML încorporat în template literals | **2 fișiere, justificate contextual** — vezi §3 |
| `.json` — JSON pur | Parsat cu `JSON.parse` toate cele 5 fișiere | **Toate valide**, fără comentarii sau expresii JS |
| `.sql` — SQL pur | Căutat pattern-uri JS (`function(`, `=>`, `require(`, `console.`, `import ... from`) în cele 5 migrări | **Toate curate.** Sintaxa `create function public.nume(...)` din SQL nu se confundă cu `function(` din JS (spațiu + nume de tabelă între ele). |

## 3. Găsire notabilă: HTML în string literals (`.ts`)

| Fișier | Linii totale | Linii HTML în template literal | Proporție |
|---|---|---|---|
| `src/lib/email/send-alert.ts` | 98 | ~35 | ~36% |
| `src/lib/email/send-verification-result.ts` | 116 | ~41 | ~35% |

Ambele fișiere construiesc corpul unui email (trimis prin Resend) printr-un template literal cu markup HTML brut (`<table>`, `<tr>`, `<td>`, etc.), în funcții `buildHtml()`.

**De ce nu-l raportez ca încălcare dură:** clientele de email nu randează React/JSX — orice bibliotecă de trimis email (Resend, Nodemailer, SendGrid) cere un string HTML la `.send()`. Fără o bibliotecă dedicată gen `react-email` (care compilează JSX în HTML la momentul trimiterii), HTML-ul scris de mână într-un template literal e abordarea standard, nu un cod-smell. E totuși genul de fișier pe care l-ai întrebat explicit să-l semnalez, deci îl semnalez — dar cu context, nu ca defect.

**Dacă ai vrea să elimini complet HTML-ul din `.ts`:** singura variantă reală ar fi adoptarea `react-email` (componente `.tsx` compilate în HTML la trimitere) — o schimbare de arhitectură, nu o reparație mică. Nu am făcut asta, doar o notez ca opțiune.

## 4. Observație în afara celor 5 categorii cerute

`src/prototypes/autodocs-landing.jsx` și `src/prototypes/autodocs-prototype.jsx` — 2 fișiere `.jsx` (extensie a 6-a, neinclusă în cerere) care trăiesc în `src/` alături de codul de producție. Sunt documentate explicit în `CLAUDE.md` drept „prototipuri vizuale, referință, nu cod de producție" — deci intenționat separate de restul, dar merită menționate fiindcă `.jsx` (fără tipare TypeScript) e o excepție de la restul bazei de cod, care e 100% `.tsx`/`.ts`.

## Rezumat

Structura de fișiere e curată. Nicio încălcare dură găsită pe niciuna dintre cele 5 categorii cerute:

- **`.tsx`**: fără CSS inline masiv, fără CSS-in-JS
- **`.css`**: pur, fără JS
- **`.ts`**: fără JSX real; 2 fișiere cu HTML-in-string pentru template-uri de email, justificat de natura problemei (nu există alternativă fără o bibliotecă dedicată)
- **`.json`**: toate valide, pure
- **`.sql`**: toate curate

Singurul lucru de reținut pentru viitor: dacă echipa crește sau numărul de template-uri de email crește, merită reevaluat `react-email` ca să elimini complet HTML-ul brut din fișierele `.ts`.
