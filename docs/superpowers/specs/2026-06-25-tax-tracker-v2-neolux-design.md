# Tax Tracker v2 — "Neo-Lux" Redesign + Passcode Lock + Enhancements

**Date:** 2026-06-25
**Author:** Brainstormed with Ieskandar Zulqarnain
**Status:** Approved design → ready for implementation plan
**Builds on:** the v1 app (`docs/superpowers/specs/2026-06-25-malaysian-tax-tracker-design.md`)

---

## 1. Goals

A v2 upgrade of the existing browser-only Malaysian tax tracker:

1. **Passcode "login"** with at-rest **encryption** of all data (Web Crypto), always-on.
2. **"Neo-Lux" visual rework** of every page — modern, attractive, fully responsive (xs→xl), light + noir-dark.
3. **Income-source entry model** (define jobs once, project across the year, override per month). Source cards side-by-side on desktop.
4. **Multi-year support** (switch/compare assessment years).
5. **Enhancements:** PWA + offline, auto-lock + manual lock, set-aside savings tracker, Bank CSV import, PDF export, onboarding wizard.
6. **Expanded Borang BE guide.**

Engine stays **pure and unit-tested**. Still **no backend** — static site on GitHub Pages.

---

## 2. Visual system — "Neo-Lux"

A blend of Neobrutalism (structure) + Claymorphism (softness) + Royal Noir (palette) + Frosted Glass (overlays).

### Design tokens (CSS variables; replaces the v1 sky-blue theme)
- **Light:** paper `#fbf6ea` / surface `#fffdf7` / ink `#1a1408` / gold (primary) `#caa53a` / pink (secondary) `#ff5d8f` / emerald (positive) `#10b981` / muted `#9a8348`.
- **Dark (noir):** bg `#0c0a06` / surface `#16130d` / ink-on-dark `#f4ecd8` / gold `#e7c66b` / pink `#ff6f9c` / emerald `#34d399` / border `#3a2f17`.
- **Default mode: follow device** (`prefers-color-scheme`), with a manual toggle that persists.

### Component language
- **Cards:** surface fill, **2.5px solid ink border**, **rounded 16px** (clay), **offset shadow** `4px 4px 0 ink` (gold offset on hero/feature cards). Some cards add a soft inner highlight.
- **Buttons:** chunky bordered, 3px offset shadow; variants `gold` (primary), `ink` (dark fill), `ghost`. Pressed state nudges into the shadow.
- **Hero card:** dark ink gradient with gold accents + gold offset shadow.
- **Inputs:** white/surface fill, 2px ink border, 10px radius, bold amounts.
- **Overlays (lock screen, modals, onboarding):** **frosted glass** (translucent + backdrop-blur) over a noir/gold gradient.
- **Charts (Recharts):** gold + ink + pink + emerald series; grid muted.
- **Type:** bold, heavy numerics (700–900 weight) for figures.

### Responsiveness (xs ≤360 · sm ≤480 · md ≤768 · lg ≤1024 · xl >1024)
- Existing sidebar↔bottom-nav retained, re-skinned. All grids collapse: stat grids → 1 col on sm; income source cards 2-col on ≥md, 1-col below; tables scroll-x or reflow to stacked rows on xs; hero scales font; touch targets ≥40px. No horizontal overflow at 320px.

---

## 3. Passcode lock + encryption ("login")

### Behavior
- **Always on.** All persisted data is encrypted at rest; the app shows the lock screen until the correct passcode is entered.
- **First run:** onboarding sets a passcode (min 6 chars; confirm field; strength hint).
- **Unlock:** derive key from passcode, attempt decrypt; success → app loads with the in-memory key retained for the session (used to re-encrypt on every save). Failure → "Incorrect passcode" (no lockout, but a subtle delay).
- **Auto-lock:** after configurable idle (default 5 min) and on tab hide beyond a grace period; **manual Lock** button in the header. Locking clears the in-memory key.
- **Change passcode** (Settings): verify current → set new → re-encrypt store.
- **Forgot passcode = unrecoverable** (no key escrow). Lock screen has a **"Reset app — wipes all data"** action (typed confirmation). Onboarding and Settings prompt the user to keep an **unencrypted JSON backup** (with an explicit "this backup is NOT encrypted" warning).

### Crypto design (`src/security/crypto.js`, pure, testable)
- `deriveKey(passcode, salt)` → PBKDF2 (SHA-256, ≥150k iterations) → AES-GCM `CryptoKey`.
- `encryptJSON(obj, key)` → `{ iv, ciphertext }` (AES-GCM, random 12-byte IV).
- `decryptJSON({iv, ciphertext}, key)` → object, or throws on auth failure (wrong key/tamper).
- Storage shape in localStorage key `tax-vault-v2`: `{ v:2, salt, iv, ciphertext }`. Salt generated once at passcode creation.
- A small `useVault()` hook manages: locked/unlocked state, the in-memory key, `unlock(passcode)`, `lock()`, `setPasscode`, `changePasscode`, `resetApp`, and transparently encrypts on store writes.
- **Honest scope note (in UI footer/about):** client-side encryption protects data at rest on a shared/lost device; it is not a server-auth system.

---

## 4. Data model (v2)

Top-level **vault** (decrypted in memory):

```
AppData {
  schemaVersion: 2,
  settings: {                      // global, not per-year
    theme: "system" | "light" | "dark",
    autoLockMinutes: 5,
    onboarded: boolean
  },
  activeYear: 2026,
  years: {
    "2026": YearProfile,
    "2027": YearProfile, ...
  }
}

YearProfile {
  taxYear, residentStatus, maritalStatus,
  incomeSources: IncomeSource[],   // NEW — source of truth for projection
  monthOverrides: { "2026-03": { mainSalary?, partTime?: PartTimeEntry[] } },  // per-month edits
  pcbPaid: PcbEntry[],
  reliefs: Relief[],
  taxBrackets?: Bracket[],
  savings: { entries: { month, amount }[] }   // NEW — set-aside tracker
}

IncomeSource {
  id, type: "main" | "part",
  name, paidVia,
  monthlyGross?,                   // main
  amountPerPayment?, schedule?,    // part ("1st & 15th", "monthly", ...)
  monthsActive: { from: 1, to: 12 },
  autoStatutory: boolean           // main: apply EPF/SOCSO/EIS
}
```

### Migration
- On first v2 load, if the old `tax-profile-2026` (v1, unencrypted) exists, offer to **import it** into `years[2026]` during onboarding (then it's encrypted). v1 months → `monthOverrides` (each non-projected month preserved); a Main Job + Nuvera Part-time source are pre-created from the seed.
- `materializeMonths(incomeSources, monthOverrides, year)` (pure) expands sources into 12 months, then applies overrides. `computeTax` consumes the materialized months — **engine signature unchanged** (still takes a profile with `income.months`); a thin adapter builds that from the materialized result, so all existing engine tests keep passing.

---

## 5. Pages (reworked)

1. **Lock screen** — frosted gold-glass card on noir gradient; passcode input, unlock, reset link.
2. **Onboarding wizard** — welcome → set passcode → use-sample-data / start-blank / import-v1 → add main job + part-time (the source form) → finish.
3. **Dashboard** — Neo-Lux hero (balance due/refund), stat cards, income chart, **savings-tracker** card, encouraging copy. Year switcher in header.
4. **Income** — **Income Sources** form (side-by-side source cards, add/remove) **+** the month-override log below; CSV import button.
5. **Reliefs** — reworked cards with limit bars + what-if savings.
6. **Tax Calc** — bracket breakdown + scenario comparison, re-skinned.
7. **Borang BE Guide** — expanded (see §7).
8. **Settings** — theme, auto-lock minutes, change passcode, export/import JSON, reset app, manual lock.

Header gains: **year switcher**, **Lock** button, theme toggle.

---

## 6. Enhancements

- **PWA + offline:** use **`vite-plugin-pwa`** (Workbox) to generate the service worker + `manifest.webmanifest` (name, icons, theme color, standalone, `registerType: autoUpdate`); precache built assets, offline-first. Add an "Install app" affordance. Must work fully offline after first load.
- **Set-aside savings tracker:** per-year `savings.entries`; Dashboard card shows total set aside vs **target** (projected balance due) with a progress bar and a monthly suggested amount.
- **Bank CSV import (`src/data/csvImport.js`, pure parser):** parse Bank Islam CASA CSV → list credit transactions → review table (select rows, assign to month as part-time `monthOverrides`). Pure parsing + a review modal. Tolerant of header variations; never auto-commits without confirmation.
- **PDF export:** dedicated **print stylesheet** + a print-only summary layout (tax summary + BE field list); "Export PDF" calls `window.print()` (user saves as PDF). No heavy dependency.
- **Onboarding wizard:** as in §5.2; only shown when `settings.onboarded` is false.

---

## 7. Expanded Borang BE Guide content

Static, structured content (driven by live figures where relevant):
- **Before you start:** who files BE (resident, no business income), register for e-Filing / first-time PIN, documents to prepare (EA form, part-time payment records, relief receipts, PCB ledger).
- **Step-by-step e-Filing:** login at mytax.hasil.gov.my → select Borang BE YA2026 → **Bahagian B** employment income (include main + part-time, with the user's `totalGross`) → **Bahagian C/D** reliefs (each relief explained with limits and the user's amounts) → review tax charged vs PCB → submit.
- **Payment:** balance via FPX (Maybank2U) or JomPAY biller 30001; refund — ensure bank account updated in MyTax.
- **Special notes:** the RM300 "Umiii" personal transfer is **not income** (excluded); part-time is declared as employment income.
- **Deadlines & penalties:** 30 April 2027; consequences of late filing/payment.
- **After filing:** checking submission status and refund status.
- A **"before you file" checklist** (receipts, SSPN, medical checkup, bank account) — carried from v1.

---

## 8. Architecture / file structure additions

```
src/
  security/ crypto.js, useVault.js
  state/    appData.js (schema, defaults, migration v1→v2), materialize.js
  data/     csvImport.js
  pages/    Lock.jsx, Onboarding.jsx, Settings.jsx (+ reworked existing)
  components/ SourceCard.jsx, YearSwitcher.jsx, SavingsCard.jsx, ImportCsvModal.jsx, PrintSummary.jsx
  pwa/      manifest.webmanifest, service-worker (via vite plugin or hand-rolled)
  styles/   theme.css (Neo-Lux tokens), app.css (reworked)
```

- Keep the **pure engine** (`src/engine/*`) unchanged in signature; add `materializeMonths` as a pure module feeding it.
- `useProfile` is refactored to read/write the **active year** inside the decrypted vault via `useVault`.

---

## 9. Testing

- **Crypto:** round-trip encrypt→decrypt; wrong passcode throws; tamper detection.
- **materializeMonths:** sources expand correctly; overrides win; months-active range respected.
- **Migration:** v1 profile → v2 vault shape; figures preserved (gross, PCB 627.45).
- **CSV parser:** sample rows → correct credit extraction; malformed rows handled.
- **Savings:** target = projected balance due; totals correct.
- **Engine:** all existing tests remain green (signature unchanged).
- Component tests for lock (wrong/right passcode), onboarding gate, year switch, source add/remove, presence of expanded BE content.

---

## 10. Build phasing (for the implementation plan / workflow)

1. **Foundation:** Neo-Lux theme tokens + restyle shared components; v2 data model + migration + `materializeMonths` + `useVault` scaffolding (no UI lock yet).
2. **Lock + onboarding:** crypto module, lock screen, auto-lock, onboarding wizard, Settings.
3. **Income sources + savings + multi-year:** source form (side-by-side), month overrides, year switcher, savings tracker.
4. **Enhancements + content:** PWA/offline, CSV import, PDF print export, expanded BE Guide; final responsive QA across xs→xl.

---

## 11. Out of scope (YAGNI)
- No real server accounts / cloud sync (explicitly chosen against).
- No biometric/WebAuthn unlock (passcode only for now).
- No non-resident / business-income (Borang B) logic.
- No automatic bank API; CSV import is manual-file only.
