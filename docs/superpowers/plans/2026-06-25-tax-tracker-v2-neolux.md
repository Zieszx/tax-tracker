# Tax Tracker v2 (Neo-Lux + Passcode Lock) Implementation Plan

> **For agentic workers:** Implement task-by-task. Each task is independently testable, ends with passing tests + a commit. Steps use `- [ ]`.

**Goal:** Upgrade the v1 tracker to v2: Neo-Lux visual system, always-on passcode lock with AES-GCM encryption, income-source entry model, multi-year support, and enhancements (PWA, auto-lock, savings tracker, CSV import, PDF export, onboarding), plus an expanded BE Guide.

**Architecture:** Keep the pure engine (`src/engine/*`) signature-unchanged. Add pure modules: `crypto`, `materialize`, `appData` (v2 schema + migration), `csvImport`. A `useVault` hook owns the decrypted in-memory `AppData` + encryption-on-write; `useProfile` is refactored to read/write the active year. UI is reworked to Neo-Lux tokens and made responsive xs→xl.

**Tech Stack:** Vite, React 18 (JSX), React Router (HashRouter), Recharts, Vitest + Testing Library, Web Crypto API (SubtleCrypto), vite-plugin-pwa.

## Global Constraints

- **No backend.** Static site, GitHub Pages, `vite base: './'`, HashRouter. Must keep building & deploying via existing `.github/workflows/deploy.yml`.
- **All persisted data encrypted at rest** under localStorage key `tax-vault-v2` = `{ v:2, salt, iv, ciphertext }`. Plaintext `AppData` exists only in memory while unlocked.
- **Engine stays pure** (`src/engine/*`) with unchanged signatures; **all existing engine tests must keep passing.**
- **Neo-Lux tokens (CSS variables) — exact values:**
  - Light: `--paper:#fbf6ea; --surface:#fffdf7; --ink:#1a1408; --gold:#caa53a; --pink:#ff5d8f; --positive:#10b981; --muted:#9a8348; --border:#1a1408`.
  - Dark (`:root[data-theme="dark"]`): `--paper:#0c0a06; --surface:#16130d; --ink:#f4ecd8; --gold:#e7c66b; --pink:#ff6f9c; --positive:#34d399; --muted:#9a8348; --border:#3a2f17`.
  - Card: 2.5px solid `--border`, radius 16px, shadow `4px 4px 0 var(--border)`. Buttons: chunky, 3px offset shadow, variants gold/ink/ghost. Overlays: frosted glass (translucent + backdrop-blur).
- **Default theme: follow device** (`prefers-color-scheme`) unless user overrode; persisted in `settings.theme`.
- **Responsive:** no horizontal overflow at 320px; income source cards 2-col ≥768px else 1-col; touch targets ≥40px.
- **Money format `RM 1,234.56`** via existing `formatRM`.
- Commit after every task; message ends with `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`. Repo has no git user → commit with `git -c user.name="Ieskandar" -c user.email="nuverarosecompany@gmail.com" commit ...`.
- Run focused tests while iterating; run full suite (`npx vitest run`) + `npm run build` before committing each task.

---

## File Structure

```
src/
  engine/        (unchanged) constants, deductions, tax, format
  security/      crypto.js, useVault.jsx
  state/         appData.js (schema/defaults/migration), materialize.js
  data/          csvImport.js, defaultProfile.js (kept for seed)
  hooks/         useLocalStorage.js (kept), useProfile.jsx (refactored to vault active-year)
  components/    Nav, Card, StatCard, ProgressBar, ThemeToggle, Footer, Button,
                 SourceCard, YearSwitcher, SavingsCard, ImportCsvModal, PrintSummary, LockButton
  pages/         Lock, Onboarding, Settings, Dashboard, Income, Reliefs, TaxCalc, BorangGuide
  styles/        theme.css (Neo-Lux), app.css (reworked), print.css
  pwa assets     public/manifest icons; vite.config pwa plugin
```

---

# PHASE 1 — Foundation (theme tokens, v2 data model, pure modules)

## Task 1.1: Neo-Lux theme tokens + Button component

**Files:** Modify `src/styles/theme.css`; Create `src/components/Button.jsx`; Modify `src/styles/app.css` (card/button classes); Test `src/components/Button.test.jsx`.

**Interfaces:**
- Produces: CSS vars per Global Constraints (light + dark). `<Button variant="gold|ink|ghost" onClick>{children}</Button>` → `<button class="btn btn-gold">`.

- [ ] **Step 1 — failing test** `src/components/Button.test.jsx`:
```jsx
import { render, screen, fireEvent } from '@testing-library/react'
import Button from './Button.jsx'
test('renders variant class and fires onClick', () => {
  const fn = vi.fn()
  render(<Button variant="gold" onClick={fn}>Save</Button>)
  const b = screen.getByRole('button', { name: 'Save' })
  expect(b.className).toMatch(/btn-gold/)
  fireEvent.click(b); expect(fn).toHaveBeenCalled()
})
```
- [ ] **Step 2 — run, expect FAIL** `npx vitest run src/components/Button.test.jsx`
- [ ] **Step 3 — implement** `src/components/Button.jsx`:
```jsx
export default function Button({ variant = 'gold', className = '', ...rest }) {
  return <button className={`btn btn-${variant} ${className}`} {...rest} />
}
```
Replace the `theme.css` `:root`/dark blocks with the exact Neo-Lux tokens from Global Constraints (keep `--radius`, `--shadow` updated: `--shadow: 4px 4px 0 var(--border)`). In `app.css`, update `.card` to `background:var(--surface);border:2.5px solid var(--border);border-radius:16px;box-shadow:var(--shadow);padding:16px;` and add:
```css
.btn{font:inherit;font-weight:800;cursor:pointer;border:2.5px solid var(--border);border-radius:12px;padding:9px 15px;box-shadow:3px 3px 0 var(--border);transition:transform .05s, box-shadow .05s;}
.btn:active{transform:translate(2px,2px);box-shadow:1px 1px 0 var(--border);}
.btn-gold{background:var(--gold);color:#1a1408;}
.btn-ink{background:#171206;color:#fff;}
.btn-dark .btn-ink, :root[data-theme="dark"] .btn-ink{background:#000;}
.btn-ghost{background:transparent;color:var(--ink);}
```
- [ ] **Step 4 — run, expect PASS**; then `npx vitest run` (all green) and `npm run build`.
- [ ] **Step 5 — commit** `feat: Neo-Lux theme tokens and Button component`

## Task 1.2: ThemeToggle follows device by default

**Files:** Modify `src/components/ThemeToggle.jsx`; Test `src/components/ThemeToggle.test.jsx`.

**Interfaces:** Consumes `useLocalStorage('theme','system')`. Applies resolved theme to `document.documentElement[data-theme]`. `system` → resolve via `matchMedia('(prefers-color-scheme: dark)')`.

- [ ] **Step 1 — failing test**: render ThemeToggle; assert that with stored `'system'` and a mocked `matchMedia` returning dark, `document.documentElement.getAttribute('data-theme')==='dark'`; clicking cycles system→light→dark→system (assert attribute changes). (Mock `window.matchMedia` in the test.)
- [ ] **Step 2 — run, expect FAIL**
- [ ] **Step 3 — implement**: state is `'system'|'light'|'dark'`; `resolve(theme)` returns `'light'|'dark'`; `useEffect` sets the attribute to the resolved value and subscribes to `matchMedia` change when in system mode; toggle cycles the three. Provide an accessible `aria-label`.
- [ ] **Step 4 — run PASS**, full suite, build.
- [ ] **Step 5 — commit** `feat: theme toggle defaults to device preference`

## Task 1.3: v2 AppData schema, defaults & v1→v2 migration (pure)

**Files:** Create `src/state/appData.js`; Test `src/state/appData.test.js`.

**Interfaces (pure, no React):**
- `SCHEMA_VERSION = 2`.
- `blankYearProfile(year:number): YearProfile` — `{ taxYear, residentStatus:'resident', maritalStatus:'single', incomeSources:[], monthOverrides:{}, pcbPaid:[], reliefs: RELIEF_TEMPLATE clone, taxBrackets: undefined, savings:{entries:[]} }`.
- `blankAppData(year=2026): AppData` — `{ schemaVersion:2, settings:{theme:'system',autoLockMinutes:5,onboarded:false}, activeYear:year, years:{ [year]: blankYearProfile(year) } }`.
- `migrateV1(v1profile): YearProfile` — convert the v1 `defaultProfile`-shaped object into a YearProfile: derive a Main Job source (`type:'main', name:'Main employer', monthlyGross:` the modal/most-common salary, `monthsActive:{from:1,to:12}, autoStatutory:true`) and a Nuvera Part-time source (`type:'part', name:'Nuvera', amountPerPayment:1000, schedule:'1st & 15th', monthsActive:{from:1,to:12}, autoStatutory:false`); set `monthOverrides` from every v1 month so figures are preserved exactly (key `month`, value `{ mainSalary, partTime }`); copy `pcbPaid`, `reliefs`, `taxBrackets`.
- `loadOrInitAppData(opts)` is NOT here (that's the vault's job) — this module is pure transforms only.

- [ ] **Step 1 — failing tests** `src/state/appData.test.js`:
```js
import { blankAppData, blankYearProfile, migrateV1, SCHEMA_VERSION } from './appData.js'
import { defaultProfile } from '../data/defaultProfile.js'
import { computeTax } from '../engine/tax.js'
import { materializeMonths } from './materialize.js'  // available after Task 1.4 — order 1.4 before running

test('blankAppData has schema 2, one year, not onboarded', () => {
  const d = blankAppData(2026)
  expect(d.schemaVersion).toBe(2)
  expect(Object.keys(d.years)).toEqual(['2026'])
  expect(d.settings.onboarded).toBe(false)
})
test('migrateV1 preserves gross and PCB via overrides', () => {
  const yp = migrateV1(defaultProfile)
  const months = materializeMonths(yp.incomeSources, yp.monthOverrides, 2026)
  const r = computeTax({ income:{months}, reliefs: yp.reliefs, pcbPaid: yp.pcbPaid, settings:{taxBrackets: yp.taxBrackets} })
  expect(r.pcbPaid).toBeCloseTo(627.45, 2)
  expect(r.totalGross).toBeGreaterThan(68000)
  expect(r.totalGross).toBeLessThan(78000)
})
```
> NOTE: implement Task 1.4 (`materialize.js`) before running this test, since the migration test depends on it. The two tasks may be committed together if the reviewer prefers; keep them as separate commits where possible.
- [ ] **Step 2 — run, expect FAIL**
- [ ] **Step 3 — implement** `src/state/appData.js` per Interfaces. For the Main Job `monthlyGross`, use the most frequent v1 `mainSalary` (4500). The overrides preserve exact per-month figures so totals match v1 regardless of the source projection.
- [ ] **Step 4 — run PASS** (after 1.4), full suite, build.
- [ ] **Step 5 — commit** `feat: v2 AppData schema, defaults and v1 migration`

## Task 1.4: materializeMonths (pure projection + overrides)

**Files:** Create `src/state/materialize.js`; Test `src/state/materialize.test.js`.

**Interfaces:**
- `materializeMonths(incomeSources, monthOverrides, year): Month[]` where `Month = { month:'YYYY-MM', mainSalary:number, partTime:[{date,amount,note}] }`.
- Projection rules: for each month 1..12 within `[year]`: `mainSalary` = sum of `monthlyGross` of `type:'main'` sources whose `monthsActive` covers that month; `partTime` = for each `type:'part'` source active that month, expand by `schedule` (`'1st & 15th'`→ two entries dated `-01` and `-15` each `amountPerPayment`; `'monthly'`→ one entry dated `-01`; otherwise one entry dated `-01`). Then **override**: if `monthOverrides['YYYY-MM']` exists, its `mainSalary`/`partTime` (when present) REPLACE the projected values for that month.

- [ ] **Step 1 — failing tests** `src/state/materialize.test.js`:
```js
import { materializeMonths } from './materialize.js'
const main = { id:'m', type:'main', monthlyGross:4500, monthsActive:{from:1,to:12} }
const part = { id:'p', type:'part', amountPerPayment:1000, schedule:'1st & 15th', monthsActive:{from:1,to:12} }
test('projects 12 months with main + biweekly part-time', () => {
  const months = materializeMonths([main, part], {}, 2026)
  expect(months).toHaveLength(12)
  expect(months[0]).toMatchObject({ month:'2026-01', mainSalary:4500 })
  expect(months[0].partTime).toHaveLength(2)
  expect(months[0].partTime[0]).toMatchObject({ date:'2026-01-01', amount:1000 })
})
test('monthsActive range excludes outside months', () => {
  const m = materializeMonths([{ ...main, monthsActive:{from:3,to:6} }], {}, 2026)
  expect(m[0].mainSalary).toBe(0)
  expect(m[2].mainSalary).toBe(4500)
  expect(m[11].mainSalary).toBe(0)
})
test('override replaces projected month', () => {
  const m = materializeMonths([main], { '2026-02': { mainSalary: 9999, partTime: [] } }, 2026)
  expect(m[1].mainSalary).toBe(9999)
})
```
- [ ] **Step 2 — run, expect FAIL**
- [ ] **Step 3 — implement** per Interfaces (pure, no React).
- [ ] **Step 4 — run PASS**, full suite, build.
- [ ] **Step 5 — commit** `feat: materializeMonths projection with per-month overrides`

## Task 1.5: crypto module (AES-GCM + PBKDF2, pure)

**Files:** Create `src/security/crypto.js`; Test `src/security/crypto.test.js`.

**Interfaces (async, uses global `crypto.subtle`):**
- `generateSalt(): Uint8Array` (16 bytes via `crypto.getRandomValues`).
- `deriveKey(passcode:string, salt:Uint8Array): Promise<CryptoKey>` — PBKDF2 SHA-256, 150_000 iters, AES-GCM 256.
- `encryptJSON(obj, key): Promise<{iv:string, ciphertext:string}>` — random 12-byte IV; base64 strings out.
- `decryptJSON({iv, ciphertext}, key): Promise<any>` — throws on auth failure.
- base64 helpers internal. Use `TextEncoder`/`TextDecoder`.

- [ ] **Step 1 — failing tests** `src/security/crypto.test.js`:
```js
import { generateSalt, deriveKey, encryptJSON, decryptJSON } from './crypto.js'
test('round-trips an object', async () => {
  const salt = generateSalt(); const key = await deriveKey('hunter2', salt)
  const enc = await encryptJSON({ a: 1, b: 'x' }, key)
  expect(typeof enc.ciphertext).toBe('string')
  expect(await decryptJSON(enc, key)).toEqual({ a: 1, b: 'x' })
})
test('wrong passcode fails to decrypt', async () => {
  const salt = generateSalt()
  const enc = await encryptJSON({ a: 1 }, await deriveKey('right', salt))
  const wrong = await deriveKey('wrong', salt)
  await expect(decryptJSON(enc, wrong)).rejects.toBeTruthy()
})
```
> jsdom provides `crypto.subtle` in Node ≥20 (vitest runs on Node 20). If unavailable, the test setup imports `node:crypto`'s `webcrypto` and assigns `globalThis.crypto`. Add that guard to `src/test/setup.js` if needed.
- [ ] **Step 2 — run, expect FAIL**
- [ ] **Step 3 — implement** per Interfaces.
- [ ] **Step 4 — run PASS**, full suite, build.
- [ ] **Step 5 — commit** `feat: AES-GCM/PBKDF2 crypto module`

---

# PHASE 2 — Vault, lock screen, onboarding, settings

## Task 2.1: useVault hook (in-memory decrypted AppData + encryption-on-write)

**Files:** Create `src/security/useVault.jsx`; Test `src/security/useVault.test.jsx`.

**Interfaces:** `VaultProvider` + `useVault()` →
`{ status: 'empty'|'locked'|'unlocked', data, hasVault, unlock(passcode):Promise<boolean>, lock(), createVault(passcode, initialData):Promise<void>, save(updater), changePasscode(old,new):Promise<boolean>, resetApp(), exportPlain():string, settings }`.
- Reads `tax-vault-v2` from localStorage. If absent → `status:'empty'` (`hasVault:false`). If present → `status:'locked'`.
- `unlock` derives key from stored salt, decrypts; on success store key in memory (ref), set `data` + `status:'unlocked'`, return true; on failure return false.
- `createVault(passcode, initialData)` — generate salt, derive key, encrypt initialData, persist, set unlocked.
- `save(updater)` — `data = updater(data)`; re-encrypt with in-memory key; persist; update state. Throws if locked.
- `lock()` clears key + data, `status:'locked'`.
- `resetApp()` removes the localStorage key, `status:'empty'`.

- [ ] **Step 1 — failing tests** (use `renderHook` with `wrapper: VaultProvider`, clear localStorage in beforeEach):
  - create→unlocked: `createVault('pass1234', blankAppData())` then `status==='unlocked'` and `data.schemaVersion===2`.
  - lock→unlock cycle: after create, `lock()` → `'locked'`; `unlock('pass1234')` → true & `'unlocked'`; `unlock('nope')` → false.
  - save persists: `save(d=>({...d, activeYear: 2027}))` then re-`lock()`+`unlock()` shows `activeYear===2027`.
- [ ] **Step 2 — run, expect FAIL**
- [ ] **Step 3 — implement** per Interfaces (async crypto inside; keep key in a `useRef`).
- [ ] **Step 4 — run PASS**, full suite, build.
- [ ] **Step 5 — commit** `feat: useVault encrypted in-memory store`

## Task 2.2: Lock screen page (frosted-glass Neo-Lux)

**Files:** Create `src/pages/Lock.jsx`; Modify `src/styles/app.css` (lock styles); Test `src/pages/Lock.test.jsx`.

**Interfaces:** Consumes `useVault()`. Renders passcode input + Unlock (frosted glass card on noir gradient per Neo-Lux). On submit calls `unlock`; on false shows "Incorrect passcode." Has a "Reset app (wipes data)" link → confirm → `resetApp()`.

- [ ] **Step 1 — failing test** (wrap in VaultProvider; seed a vault by calling createVault in a setup, or mock useVault): render Lock; type wrong passcode, submit, assert `/incorrect/i` appears; type right passcode, submit, assert `unlock` resolves and no error. (If seeding a real vault is heavy, mock `useVault` to return an `unlock` that resolves false then true.)
- [ ] **Step 2 — run, expect FAIL**
- [ ] **Step 3 — implement** Lock.jsx + `.lock-*` styles (frosted glass: `background:rgba(255,255,255,.08);backdrop-filter:blur(10px);border:2px solid var(--gold);box-shadow:6px 6px 0 rgba(202,165,58,.5)` on a `radial-gradient` noir backdrop). Passcode `<input type="password" aria-label="passcode">`.
- [ ] **Step 4 — run PASS**, full suite, build.
- [ ] **Step 5 — commit** `feat: frosted-glass lock screen`

## Task 2.3: Onboarding wizard

**Files:** Create `src/pages/Onboarding.jsx`; Test `src/pages/Onboarding.test.jsx`.

**Interfaces:** Consumes `useVault()`. Multi-step: (1) welcome, (2) set passcode (+confirm, min 6, strength hint, unencrypted-backup warning), (3) choose: use-sample-data / start-blank / import-v1 (if `localStorage['tax-profile-2026']` exists), (4) finish → `createVault(passcode, chosenAppData)` and mark `settings.onboarded=true`. Sample = `migrateV1(defaultProfile)` into `years[2026]`; blank = `blankAppData()`; import-v1 = migrate the found v1 object.

- [ ] **Step 1 — failing test**: render Onboarding; step through (welcome→next; enter matching passcode→next; choose "start blank"→finish); assert `createVault` called with an AppData whose `settings.onboarded===true`. Assert mismatched passcodes show an error and block advancing.
- [ ] **Step 2 — run FAIL**
- [ ] **Step 3 — implement** wizard (local step state; Neo-Lux frosted panels). Reuse `Button`.
- [ ] **Step 4 — run PASS**, full suite, build.
- [ ] **Step 5 — commit** `feat: onboarding wizard with passcode setup`

## Task 2.4: App shell wiring — gate on vault state + auto-lock + Lock button

**Files:** Modify `src/App.jsx`; Create `src/components/LockButton.jsx`; Modify `src/main.jsx` (wrap in VaultProvider); Test `src/App.test.jsx` (or extend smoke).

**Interfaces:** App routing logic: if `status==='empty'` → render `<Onboarding/>`; if `'locked'` → `<Lock/>`; if `'unlocked'` → the normal Nav + Routes (now also `/settings`). Auto-lock: a hook that on `unlocked` listens for inactivity (`settings.autoLockMinutes`) via timers reset on pointer/key events, and calls `lock()`. `LockButton` calls `lock()`.

- [ ] **Step 1 — failing test**: with a mocked `useVault` returning `status:'empty'`, App shows onboarding; `status:'locked'` shows lock; `status:'unlocked'` shows nav ("Dashboard"). (Mock the hook module.)
- [ ] **Step 2 — run FAIL**
- [ ] **Step 3 — implement** gating + auto-lock hook (`src/security/useAutoLock.js` may be added) + LockButton. Update existing smoke test if needed so it renders an unlocked state.
- [ ] **Step 4 — run PASS**, full suite, build.
- [ ] **Step 5 — commit** `feat: gate app on vault state with auto-lock`

## Task 2.5: Refactor useProfile to active-year vault adapter

**Files:** Modify `src/hooks/useProfile.jsx`; Update dependents if signature changes; Test `src/hooks/useProfile.test.jsx`.

**Interfaces:** `useProfile()` now derives from `useVault()`:
- `profile` = an **engine-shaped** object for the active year: `{ income:{ months: materializeMonths(year.incomeSources, year.monthOverrides, year.taxYear) }, reliefs: year.reliefs, pcbPaid: year.pcbPaid, settings:{ taxBrackets: year.taxBrackets } }`.
- `result = computeTax(profile)` (memoized).
- `year` = the active `YearProfile`; `setYear(updater)` = `vault.save` on `years[activeYear]`.
- Keep `resetToDefault`/`clearToBlank`/`exportJson`/`importJson` but route through the vault (`importJson` validates and replaces the active year or whole AppData as appropriate; keep the `'Invalid profile file'` unified error and array checks).

- [ ] **Step 1 — failing tests**: wrap in VaultProvider seeded (via createVault) with `migrateV1(defaultProfile)`; assert `result.pcbPaid≈627.45` and `result.totalGross` in range; `setYear` to bump a relief and assert `result` updates.
- [ ] **Step 2 — run FAIL**
- [ ] **Step 3 — implement** the adapter; ensure pages that imported `useProfile` still compile (Dashboard/Income/Reliefs/TaxCalc/BorangGuide consume `profile`/`result` as before; `Income` will be reworked in Phase 3).
- [ ] **Step 4 — run PASS**, full suite, build.
- [ ] **Step 5 — commit** `refactor: useProfile reads active year from vault`

## Task 2.6: Settings page

**Files:** Create `src/pages/Settings.jsx`; add route + nav entry; Test `src/pages/Settings.test.jsx`.

**Interfaces:** theme select (system/light/dark), auto-lock minutes input, change-passcode form (old/new/confirm → `changePasscode`), export JSON (download), import JSON (file), manual Lock, **Reset app** (typed-confirm → `resetApp`). Consumes `useVault` + `useProfile`.

- [ ] **Step 1 — failing test**: render Settings (VaultProvider seeded); assert presence of "Change passcode", "Auto-lock", "Reset app", "Export"; changing auto-lock minutes persists via vault.save.
- [ ] **Step 2 — run FAIL**
- [ ] **Step 3 — implement**.
- [ ] **Step 4 — run PASS**, full suite, build.
- [ ] **Step 5 — commit** `feat: settings page (theme, auto-lock, passcode, reset)`

---

# PHASE 3 — Income sources, savings tracker, multi-year

## Task 3.1: SourceCard + Income page rework (side-by-side sources + override log)

**Files:** Create `src/components/SourceCard.jsx`; Rewrite `src/pages/Income.jsx` (rename/replace the old `IncomeLog.jsx` route to `/income`); Modify `app.css`; Test `src/pages/Income.test.jsx`.

**Interfaces:** Income page shows `year.incomeSources` as **SourceCards in a 2-col grid (≥768px) / 1-col below**, each editable (main vs part fields per spec), add/remove source (writes via `useProfile.setYear`). Below: the **month-override log** (materialized months, editable → writes `monthOverrides`). Projected annual gross shown. CSV import button (modal wired in Task 4.2; until then a disabled/placeholder button is acceptable but prefer wiring in 4.2).

- [ ] **Step 1 — failing tests**: render Income (seeded vault); assert two source cards (Main + Nuvera) render; add a part-time source → 3 cards; edit main monthlyGross → projected annual gross text updates; assert the grid container has the responsive class.
- [ ] **Step 2 — run FAIL**
- [ ] **Step 3 — implement** SourceCard + Income page. Use `materializeMonths` for the override log display. All writes immutable through `setYear`.
- [ ] **Step 4 — run PASS**, full suite, build.
- [ ] **Step 5 — commit** `feat: income sources entry (side-by-side) with override log`

## Task 3.2: YearSwitcher + multi-year (add/switch/clone)

**Files:** Create `src/components/YearSwitcher.jsx`; Modify header in `App.jsx`; Modify `useProfile`/vault helpers for year ops; Test `src/components/YearSwitcher.test.jsx`.

**Interfaces:** Dropdown of `Object.keys(years)`; selecting sets `activeYear` (vault.save). "Add year" → choose clone-current or blank → adds `years[newYear]` and switches. Helpers `addYear(year, mode)`/`setActiveYear(year)` on the vault or useProfile.

- [ ] **Step 1 — failing test**: seeded vault with 2026; render YearSwitcher; "add year" 2027 blank → options include 2026 & 2027 and active becomes 2027; switching back to 2026 restores its data (assert a known figure).
- [ ] **Step 2 — run FAIL**
- [ ] **Step 3 — implement**.
- [ ] **Step 4 — run PASS**, full suite, build.
- [ ] **Step 5 — commit** `feat: multi-year switcher (add/switch/clone)`

## Task 3.3: Savings tracker (card + data)

**Files:** Create `src/components/SavingsCard.jsx`; add to Dashboard; savings helpers; Test `src/components/SavingsCard.test.jsx`.

**Interfaces:** `year.savings.entries:[{month, amount}]`. SavingsCard shows total set aside vs **target = max(0, result.balance)** (projected amount due) with a ProgressBar and a suggested monthly amount (`target/ remainingMonths`). Add-entry control writes via `setYear`.

- [ ] **Step 1 — failing test**: seeded vault; render SavingsCard; add an entry of 200 → total shows 200 and progress reflects 200/target.
- [ ] **Step 2 — run FAIL**
- [ ] **Step 3 — implement**; integrate into Dashboard.
- [ ] **Step 4 — run PASS**, full suite, build.
- [ ] **Step 5 — commit** `feat: set-aside savings tracker`

## Task 3.4: Restyle Dashboard, Reliefs, TaxCalc to Neo-Lux + responsive QA

**Files:** Modify `src/pages/Dashboard.jsx`, `Reliefs.jsx`, `TaxCalc.jsx`; `app.css`; Tests updated as needed.

**Interfaces:** Apply Neo-Lux hero/card/button classes; recolor Recharts to gold/ink/pink/emerald; ensure grids reflow (stat grid 1-col ≤480, scenario 1-col ≤768); no overflow at 320px. Behavior unchanged; keep existing assertions passing (update selectors only if markup changes).

- [ ] **Step 1 — adjust tests** if markup/text changed (keep behavior assertions: balance/refund label, scenario labels, what-if hint). Run to see failures.
- [ ] **Step 2 — implement** restyle.
- [ ] **Step 3 — run full suite PASS**, build.
- [ ] **Step 4 — commit** `style: Neo-Lux restyle of dashboard/reliefs/taxcalc`

---

# PHASE 4 — Enhancements + expanded BE guide + final QA

## Task 4.1: PWA (installable + offline) via vite-plugin-pwa

**Files:** Modify `package.json` (add `vite-plugin-pwa`), `vite.config.js`; add icons under `public/`; Test: build asserts SW present.

**Interfaces:** Configure `VitePWA({ registerType:'autoUpdate', manifest:{ name:'Tax Tracker 2026', short_name:'Tax26', theme_color:'#caa53a', background_color:'#fbf6ea', display:'standalone', icons:[192,512] } })`. App shows an "Install" hint when `beforeinstallprompt` fires (optional component).

- [ ] **Step 1** — add dependency + config; add placeholder PNG icons (192/512) to `public/`.
- [ ] **Step 2** — `npm run build`; assert `dist/sw.js` (or `dist/manifest.webmanifest`) exists. Add a tiny node check or a vitest test that reads the build output is optional; at minimum document the manual check.
- [ ] **Step 3** — full suite still green.
- [ ] **Step 4 — commit** `feat: PWA installable + offline (vite-plugin-pwa)`

## Task 4.2: Bank CSV import (parser + review modal)

**Files:** Create `src/data/csvImport.js`; Create `src/components/ImportCsvModal.jsx`; wire button in Income; Tests `src/data/csvImport.test.js`, modal test.

**Interfaces:**
- `parseBankCsv(text): { rows: {date, description, credit, debit}[] }` — tolerant CSV parse; identifies credit (money-in) rows; ignores debits; handles quoted fields and header variants (case-insensitive match for date/description/amount or credit columns).
- `creditsToPartTime(rows, year): { month: 'YYYY-MM', entry: {date, amount, note} }[]` — map credit rows to part-time entries.
- Modal: file input → parse → preview table with checkboxes → confirm adds selected as `monthOverrides` part-time entries via `setYear` (merging, not replacing, existing month part-time).

- [ ] **Step 1 — failing tests** `csvImport.test.js`: a sample CSV string (Bank Islam-like: `Date,Description,Debit,Credit,Balance`) → `parseBankCsv` returns the credit rows; malformed/blank lines skipped; `creditsToPartTime` yields correct month + amount.
- [ ] **Step 2 — run FAIL**
- [ ] **Step 3 — implement** parser + modal.
- [ ] **Step 4 — run PASS**, full suite, build.
- [ ] **Step 5 — commit** `feat: bank CSV import with review modal`

## Task 4.3: PDF export (print stylesheet + PrintSummary)

**Files:** Create `src/components/PrintSummary.jsx`, `src/styles/print.css`; add "Export PDF" button (Settings or BorangGuide) calling `window.print()`; Test `src/components/PrintSummary.test.jsx`.

**Interfaces:** PrintSummary renders a clean one-page summary (identity-free figures: gross, reliefs, chargeable, gross tax, PCB, balance, BE field list) hidden on screen (`.print-only`) and shown in print via `print.css` `@media print`. Button triggers `window.print()`.

- [ ] **Step 1 — failing test**: render PrintSummary with seeded result; assert it contains the gross tax figure and the BE field labels.
- [ ] **Step 2 — run FAIL**
- [ ] **Step 3 — implement** + `@media print` rules (hide app chrome, show `.print-only`).
- [ ] **Step 4 — run PASS**, full suite, build.
- [ ] **Step 5 — commit** `feat: PDF export via print summary`

## Task 4.4: Expanded Borang BE Guide

**Files:** Modify `src/pages/BorangGuide.jsx`; Test update.

**Interfaces:** Add the full content per spec §7 (before-you-start, registration, documents, step-by-step Bahagian mapping with live `result.*`, payment FPX/JomPAY, "Umiii" non-taxable note, deadlines & penalties, after-filing status, checklist). Keep data-management controls (export/import/reset moved to Settings is fine; keep a link). Structured, accessible sections; Neo-Lux styled.

- [ ] **Step 1 — update test**: assert presence of new sections — `/Documents to prepare/i`, `/Bahagian B/i`, `/30 April 2027/i`, `/JomPAY/i`, `/late/i` (penalties), `/Umiii/i`.
- [ ] **Step 2 — run FAIL**
- [ ] **Step 3 — implement** content.
- [ ] **Step 4 — run PASS**, full suite, build.
- [ ] **Step 5 — commit** `feat: expanded Borang BE e-filing guide`

## Task 4.5: Final responsive + integration QA, README update

**Files:** Modify `README.md`; small fixes as found.

- [ ] **Step 1** — run full suite (`npx vitest run`) — all green; `npm run build` — succeeds.
- [ ] **Step 2** — update README with v2 features (lock/encryption, Neo-Lux, multi-year, PWA, CSV, savings, PDF) and the manual smoke checklist (onboard → set passcode → lock/unlock → add source → switch year → install PWA → export PDF → reload persists encrypted).
- [ ] **Step 3** — document any known limitations (e.g. forgot-passcode = data loss).
- [ ] **Step 4 — commit** `docs: v2 README + final QA`

---

## Self-Review Notes
- **Spec coverage:** theme (1.1–1.2, 3.4) · data model + migration (1.3) · materialize (1.4) · crypto (1.5) · vault (2.1) · lock (2.2) · onboarding (2.3) · gating + auto-lock (2.4) · useProfile adapter (2.5) · settings + change passcode + reset (2.6) · income sources side-by-side + overrides (3.1) · multi-year (3.2) · savings (3.3) · restyle/responsive (3.4) · PWA (4.1) · CSV (4.2) · PDF (4.3) · BE guide (4.4) · QA/README (4.5). All spec sections mapped.
- **Engine untouched:** computeTax/brackets/deductions unchanged; fed via materialize adapter — existing engine tests stay green.
- **Ordering caveat:** Task 1.3's migration test depends on 1.4's `materializeMonths`; implement 1.4 before running 1.3's test (noted in 1.3).
- **Type consistency:** `AppData`/`YearProfile`/`IncomeSource` shapes are used identically across appData, materialize, useVault, useProfile, and pages.
