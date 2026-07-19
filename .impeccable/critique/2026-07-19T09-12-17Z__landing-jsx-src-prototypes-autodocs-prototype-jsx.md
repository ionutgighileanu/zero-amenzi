---
target: autodocs-landing.jsx + autodocs-prototype.jsx
total_score: 23
p0_count: 2
p1_count: 2
timestamp: 2026-07-19T09-12-17Z
slug: landing-jsx-src-prototypes-autodocs-prototype-jsx
---
## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | No loading/pending state on any submit (add vehicle, RCA purchase, driver save) |
| 2 | Match System / Real World | 4 | Plate component, RO fine amounts, VIN "rubrica E" — strong domain fluency |
| 3 | User Control and Freedom | 2 | No Escape/focus-trap on modals, no undo after delete |
| 4 | Consistency and Standards | 3 | `Button`/`Plate` duplicated between landing.jsx and prototype.jsx with drifting variant semantics (`primary` = navy in landing, black in app) |
| 5 | Error Prevention | 2 | VIN only length-checked, no duplicate-plate check, one-click RCA purchase |
| 6 | Recognition Rather Than Recall | 3 | Status colors consistent; custom "Altul" doc/alert types force free-text recall |
| 7 | Flexibility and Efficiency | 2 | No bulk add despite marketing promising it; no keyboard shortcuts |
| 8 | Aesthetic and Minimalist Design | 3 | Restrained palette, calibrated semaphore; eyebrow-label-per-section is decorative repetition |
| 9 | Error Recovery | 1 | No error states anywhere — no "plate not found," no network failure, no invalid-VIN feedback |
| 10 | Help and Documentation | 1 | No contextual help in-app; FAQ only exists on landing |
| **Total** | | **23/40** | **Acceptable — significant improvements needed before users are happy** |

## Anti-Patterns Verdict

**Start here.** Does this look AI-generated?

**LLM assessment**: Not obviously AI slop — no gradient text, no glassmorphism, no numbered 01/02/03 scaffolding, no ghost-card (1px border + wide shadow) combo. But tells remain: uppercase-tracked eyebrow label (`SectionLabel`) on every single section, a hero stat-strip (4 big-number/small-label pairs) that's the textbook "hero metric" template, and two near-identical 3-column icon+title+desc grids. Reads as competent template-driven design rescued mainly by the plate motif.

**Deterministic scan** (`detect.mjs`, exit 2, 8 findings):
- `overused-font` ×4 — Inter is loaded via Google Fonts in both files (landing.jsx:128-129, prototype.jsx:958-959). Real finding: Inter is now the single most common AI-generated-UI font.
- `gray-on-color` ×3 — washed-out gray text on tinted backgrounds: `text-slate-500 on bg-red-50` (landing.jsx:324), `text-slate-700 on bg-blue-50` (prototype.jsx:280), `text-slate-600 on bg-emerald-50` (prototype.jsx:333).
- `border-accent-on-rounded` ×1 — `border-b-2` tab-active indicator on a rounded element (prototype.jsx:776).

No overlap/false-positive disputes between the LLM read and the scan; the scan caught the font/contrast issues the LLM review didn't flag explicitly, and the LLM caught template-repetition patterns the scan can't detect.

**Visual overlays**: skipped. These are standalone prototype files not wired into a route/dev server (per CLAUDE.md, they're "referință, nu cod de producție"), so no live page exists to inject into. Fallback signal: static source review only.

## Overall Impression

Solid domain-specific foundation — the plate-as-identity device and the calibrated semaphore (quiet green, loud red) are genuine product thinking, not decoration. But the interfaces are visually finished while functionally unfinished: there's no error state, no loading state, and no recovery path anywhere in either file. That's fine for a prototype, but it's the single biggest gap before this becomes real code.

## What's Working

- **The plate as a real UI component**, used consistently as vehicle identity across cards, tables, and modals — not stock iconography.
- **The calibrated semaphore**: valid state is a quiet dot + gray text; only warning/expired escalate to colored pills. Deliberately implemented everywhere, and it matches the CLAUDE.md spec exactly.
- **"2 fields only, we fetch the rest"** in `AddVehicleModal` — directly attacks the dominant failure mode of competing apps (manual data entry fatigue), reinforced with an inline explainer.

## Priority Issues

**[P0] No error/failure states for the core verification flow**
- Why it matters: `handleVerify` in autodocs-landing.jsx only checks `plate.trim().length >= 5` and always renders a mocked success. Verification IS the product's entire value prop — a user with a real-but-invalid plate, a not-found plate, or a slow/unavailable backend gets no explanation. This is the highest-leverage gap in the whole prototype.
- Fix: design explicit not-found / error / loading states for `VerifResult` before this is wired to a real backend.
- Suggested command: `$impeccable harden`
- File: `src/prototypes/autodocs-landing.jsx:88-123`

**[P0] Destructive delete has no real safeguard or recovery**
- Why it matters: `DeleteConfirm` is a two-click confirm with no re-entry of the plate/name, no undo, no toast. Deleting a vehicle silently drops all its extra docs (tahograf, CASCO, service history) with zero recovery path — a misclick on a B2B fleet truck is a support ticket.
- Fix: add an "Undo" snackbar for N seconds post-delete, or require typing the plate to confirm for B2B vehicles specifically.
- Suggested command: `$impeccable harden`
- File: `src/prototypes/autodocs-prototype.jsx:411-425`

**[P1] Pricing-card feature lists violate the ≤4 chunking rule**
- Why it matters: the PRO and Flotă tier cards each list 6 bullet features. At the exact decision moment (pricing), cognitive load should be lowest — this is where visitors bounce, not where they should be doing the most reading.
- Fix: group into categories with sub-items, or cut to the top 4 differentiators with a "vezi tot" expand for the rest.
- Suggested command: `$impeccable layout`
- File: `src/prototypes/autodocs-landing.jsx:385-397, 410-422`

**[P1] `Button`/`Plate` duplicated between files with drifting semantics**
- Why it matters: `variant="primary"` renders navy blue in the landing file but slate-900/black in the app file, where blue is instead `variant="blue"`. Per CLAUDE.md's own convention ("Toate componentele în `src/components/`"), this WILL cause visual bugs the moment either file gets copy-pasted into a real route.
- Fix: extract one shared `Button` and `Plate` into `src/components/` now, with one consistent variant vocabulary.
- Suggested command: `$impeccable document` (then extract)
- File: `src/prototypes/autodocs-landing.jsx:37-48` vs `src/prototypes/autodocs-prototype.jsx:131-147`

**[P2] Overused font + gray-on-tint contrast (detector findings)**
- Why it matters: Inter is the most common AI-generated-UI font — a deliberate pairing choice would give the brand more personality. Separately, gray text on tinted backgrounds (red-50/blue-50/emerald-50) reads as washed out, undermining the "confident, official" plate-blue brand tone.
- Fix: consider a distinctive display/body pairing (Archivo is already distinctive for headings; Inter for body is the generic half). Darken the gray text tokens used inside tinted panels toward each tint's own hue.
- Suggested command: `$impeccable typeset` (font), `$impeccable colorize` (contrast)
- File: `autodocs-landing.jsx:128-129, 324`; `autodocs-prototype.jsx:958-959, 280, 333, 776`

## Persona Red Flags

**Jordan (First-Timer, B2C free user)**: Doesn't understand what "Premium · sincronizare lunară automată" vs "Free · verificare unică" means in practice until hovering the upsell CTA — a first-timer won't realize their free plan requires manual re-checks until they've already missed a renewal. Separately, the fine-amount stakes are only explained in the landing FAQ; a first-timer who verifies a plate and signs up without reading the FAQ never sees why this matters before committing.

**Riley (Stress-tester / fleet manager)**: Deleting a vehicle or driver mid-crisis has the exact same low-friction confirm as any other delete, with no differentiation for high-value fleet assets. Separately, the marketing copy promises "Adăugare vehicule în bulk" for the Flotă tier, but the actual prototype has no bulk-add UI anywhere — a fleet manager onboarding 20 trucks is stuck with the same one-at-a-time 2-field modal. That's a broken promise between marketing and product.

**Sam (Accessibility)**: Modals (`Modal`, `DetailModal`) have no Escape-key handler and no focus trap — keyboard and screen-reader users can tab out of an open modal into background content. Status communication is otherwise solid (color + text + icon), but B2B KPI tiles and hero stats use color-coded numbers without an accompanying icon/label for colorblind users.

## Minor Observations

- `daysUntil`/`getStatus`'s "warning ≤15 days" threshold is re-derived independently by a second function (`vehicleStatus`) for B2C card badges — two functions encoding the same business rule risk drifting apart.
- Footer legal links are all `href="#"` placeholders — expected in a prototype, flag before shipping.
- Google sign-in button is decorative inline SVG with no OAuth wiring — fine for a prototype, just noting it's not functional yet.
