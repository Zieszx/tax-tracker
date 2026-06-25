# Malaysian Tax Tracker 2026 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Vite + React (JSX) personal Malaysian income-tax tracker & calculator that runs entirely in the browser, pre-loaded with Ieskandar's 2026 data, with a transparent unit-tested tax engine and 5 pages.

**Architecture:** Static SPA. A pure, unit-tested tax-engine module (no React) is the core; React components are thin views over it. State lives in localStorage via a `useLocalStorage` hook seeded with a default profile. Theming via CSS variables; navigation is a responsive sidebar that becomes a bottom nav on mobile.

**Tech Stack:** Vite, React 18 (JSX), Vitest + @testing-library/react, Recharts, plain CSS (CSS variables, no framework).

## Global Constraints

- **No backend.** All data in browser localStorage. Must build to a static bundle.
- **Currency:** Malaysian Ringgit, format as `RM 1,234.56` (en-MY, 2 decimals).
- **Visual style:** Clean Fintech base + dark-mode toggle + warm rounded touches. Accents: sky-blue (primary `#0ea5e9`), emerald (positive/refund `#10b981`), amber (progress/warning `#f59e0b`).
- **Tax brackets & statutory rates** are stored as editable config, labelled as the assumed YA2026 schedule.
- **Accessibility:** keyboard navigable, ARIA labels on controls, WCAG AA contrast.
- **Tax engine is pure (no React/DOM imports)** and is the only place tax math lives.
- **Disclaimer:** subtle footer note — estimates only, not official tax advice.
- Commit after every task with a descriptive message ending: `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.

---

## File Structure

```
package.json, vite.config.js, vitest.config.js, index.html, .gitignore
src/
  main.jsx                      # React entry
  App.jsx                       # router/shell + theme provider
  styles/
    theme.css                   # CSS variables (light/dark), base elements
    app.css                     # layout, nav, shared component classes
  engine/
    constants.js                # rates, caps, tax brackets (editable config)
    deductions.js               # EPF / SOCSO / EIS
    tax.js                      # chargeable income, brackets, balance
    format.js                   # currency / percent formatting
  data/
    defaultProfile.js           # Ieskandar's 2026 seed data + blank profile
  hooks/
    useLocalStorage.js          # persisted state hook
    useProfile.js               # profile context + derived tax results
  components/
    Nav.jsx                     # responsive sidebar / bottom nav
    Card.jsx, StatCard.jsx      # reusable cards
    ProgressBar.jsx             # relief limit bars
    ThemeToggle.jsx
    Footer.jsx                  # disclaimer
  pages/
    Dashboard.jsx
    IncomeLog.jsx
    Reliefs.jsx
    TaxCalc.jsx
    BorangGuide.jsx
  test/                         # *.test.js / *.test.jsx co-located or here
```

---

## Task 1: Project scaffold & tooling

**Files:**
- Create: `package.json`, `vite.config.js`, `vitest.config.js`, `index.html`, `src/main.jsx`, `src/App.jsx`, `src/styles/theme.css`, `src/styles/app.css`
- Test: `src/test/smoke.test.jsx`

**Interfaces:**
- Produces: a runnable Vite app rendering `<App/>`; `npm run dev`, `npm run build`, `npm test` all work.

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "tax-tracker-2026",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.26.0",
    "recharts": "^2.12.7"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.4.8",
    "@testing-library/react": "^16.0.0",
    "@vitejs/plugin-react": "^4.3.1",
    "jsdom": "^24.1.1",
    "vite": "^5.4.0",
    "vitest": "^2.0.5"
  }
}
```

- [ ] **Step 2: Create `vite.config.js` and `vitest.config.js`**

`vite.config.js`:
```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
})
```

`vitest.config.js`:
```js
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
  },
})
```

- [ ] **Step 3: Create `index.html`, entry, shell, styles, test setup**

`index.html`:
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Tax Tracker 2026</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

`src/test/setup.js`:
```js
import '@testing-library/jest-dom'
```

`src/main.jsx`:
```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './styles/theme.css'
import './styles/app.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
```

`src/App.jsx` (temporary minimal shell, expanded in Task 8):
```jsx
export default function App() {
  return <h1>Tax Tracker 2026</h1>
}
```

`src/styles/theme.css`:
```css
:root {
  --bg: #f4f7fb; --surface: #ffffff; --text: #0f172a; --muted: #64748b;
  --border: #e2e8f0; --primary: #0ea5e9; --positive: #10b981; --warn: #f59e0b;
  --radius: 14px; --shadow: 0 4px 16px rgba(15,23,42,.06);
}
:root[data-theme="dark"] {
  --bg: #0b0f17; --surface: #121826; --text: #e7e7ea; --muted: #94a3b8;
  --border: #1f2937; --primary: #38bdf8; --positive: #34d399; --warn: #fbbf24;
  --shadow: 0 4px 20px rgba(0,0,0,.4);
}
* { box-sizing: border-box; }
body {
  margin: 0; background: var(--bg); color: var(--text);
  font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
  -webkit-font-smoothing: antialiased; transition: background .2s, color .2s;
}
a { color: inherit; }
```

`src/styles/app.css`:
```css
.app { min-height: 100vh; }
.container { max-width: 1100px; margin: 0 auto; padding: 24px; }
h2.page-title { margin: 0 0 4px; font-size: 26px; }
.subtitle { color: var(--muted); margin: 0 0 20px; }
```

- [ ] **Step 4: Write smoke test**

`src/test/smoke.test.jsx`:
```jsx
import { render, screen } from '@testing-library/react'
import App from '../App.jsx'

test('renders app heading', () => {
  render(<App />)
  expect(screen.getByText(/Tax Tracker 2026/i)).toBeInTheDocument()
})
```

- [ ] **Step 5: Install, run tests, verify**

Run: `npm install && npm test`
Expected: smoke test PASSES.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: scaffold Vite + React + Vitest project

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: Engine constants & formatting

**Files:**
- Create: `src/engine/constants.js`, `src/engine/format.js`
- Test: `src/engine/format.test.js`

**Interfaces:**
- Produces:
  - `EPF_RATE=0.11`, `SOCSO_RATE=0.005`, `SOCSO_CAP=19.75`, `EIS_RATE=0.002`, `EIS_SALARY_CAP=4000`
  - `TAX_BRACKETS: Array<{min:number, max:number|null, rate:number}>`
  - `formatRM(n:number): string` → `"RM 1,234.56"`
  - `formatPct(n:number): string` → `"3.2%"` (input is a fraction, e.g. 0.032)

- [ ] **Step 1: Write the failing test**

`src/engine/format.test.js`:
```js
import { formatRM, formatPct } from './format.js'

test('formatRM adds RM prefix, thousands, 2 decimals', () => {
  expect(formatRM(1234.5)).toBe('RM 1,234.50')
  expect(formatRM(0)).toBe('RM 0.00')
  expect(formatRM(-50.4)).toBe('-RM 50.40')
})

test('formatPct converts fraction to 1-dp percent', () => {
  expect(formatPct(0.032)).toBe('3.2%')
  expect(formatPct(0)).toBe('0.0%')
})
```

- [ ] **Step 2: Run test, verify it fails**

Run: `npx vitest run src/engine/format.test.js`
Expected: FAIL ("formatRM is not a function" / module not found).

- [ ] **Step 3: Implement constants and format**

`src/engine/constants.js`:
```js
export const EPF_RATE = 0.11
export const SOCSO_RATE = 0.005
export const SOCSO_CAP = 19.75      // RM/month for salary band > 4000
export const EIS_RATE = 0.002
export const EIS_SALARY_CAP = 4000  // EIS charged on first RM4000 of salary

// Resident individual progressive brackets (assumed YA2026 schedule, editable).
// max:null means "and above".
export const TAX_BRACKETS = [
  { min: 0,       max: 5000,    rate: 0.00 },
  { min: 5000,    max: 20000,   rate: 0.01 },
  { min: 20000,   max: 35000,   rate: 0.03 },
  { min: 35000,   max: 50000,   rate: 0.06 },
  { min: 50000,   max: 70000,   rate: 0.11 },
  { min: 70000,   max: 100000,  rate: 0.19 },
  { min: 100000,  max: 400000,  rate: 0.25 },
  { min: 400000,  max: 600000,  rate: 0.26 },
  { min: 600000,  max: 2000000, rate: 0.28 },
  { min: 2000000, max: null,    rate: 0.30 },
]
```

`src/engine/format.js`:
```js
export function formatRM(n) {
  const sign = n < 0 ? '-' : ''
  const abs = Math.abs(n).toLocaleString('en-MY', {
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  })
  return `${sign}RM ${abs}`
}

export function formatPct(fraction) {
  return `${(fraction * 100).toFixed(1)}%`
}
```

- [ ] **Step 4: Run test, verify it passes**

Run: `npx vitest run src/engine/format.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/engine/constants.js src/engine/format.js src/engine/format.test.js
git commit -m "feat: add engine constants and currency formatting

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: Statutory deductions (EPF / SOCSO / EIS)

**Files:**
- Create: `src/engine/deductions.js`
- Test: `src/engine/deductions.test.js`

**Interfaces:**
- Consumes: constants from `constants.js`.
- Produces:
  - `calcEPF(gross:number): number` → `gross * 0.11`
  - `calcSOCSO(gross:number): number` → `min(gross*0.005, 19.75)`
  - `calcEIS(gross:number): number` → `min(gross, 4000) * 0.002`

- [ ] **Step 1: Write the failing test**

`src/engine/deductions.test.js`:
```js
import { calcEPF, calcSOCSO, calcEIS } from './deductions.js'

test('EPF is 11% of gross', () => {
  expect(calcEPF(4500)).toBeCloseTo(495, 2)
})

test('SOCSO is 0.5% capped at 19.75', () => {
  expect(calcSOCSO(3000)).toBeCloseTo(15, 2)
  expect(calcSOCSO(4500)).toBeCloseTo(19.75, 2) // capped
})

test('EIS is 0.2% of first 4000', () => {
  expect(calcEIS(3000)).toBeCloseTo(6, 2)
  expect(calcEIS(4500)).toBeCloseTo(8, 2) // 4000*0.002
})
```

- [ ] **Step 2: Run test, verify it fails**

Run: `npx vitest run src/engine/deductions.test.js`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement**

`src/engine/deductions.js`:
```js
import { EPF_RATE, SOCSO_RATE, SOCSO_CAP, EIS_RATE, EIS_SALARY_CAP } from './constants.js'

export const calcEPF = (gross) => gross * EPF_RATE
export const calcSOCSO = (gross) => Math.min(gross * SOCSO_RATE, SOCSO_CAP)
export const calcEIS = (gross) => Math.min(gross, EIS_SALARY_CAP) * EIS_RATE
```

- [ ] **Step 4: Run test, verify it passes**

Run: `npx vitest run src/engine/deductions.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/engine/deductions.js src/engine/deductions.test.js
git commit -m "feat: add EPF/SOCSO/EIS deduction calculations

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4: Core tax engine (chargeable income, brackets, balance)

**Files:**
- Create: `src/engine/tax.js`
- Test: `src/engine/tax.test.js`

**Interfaces:**
- Consumes: `TAX_BRACKETS` from constants.
- Produces:
  - `calcGrossTax(chargeableIncome:number, brackets=TAX_BRACKETS): { total:number, breakdown: Array<{min,max,rate,taxable,tax}> }`
  - `sumIncome(months): { totalMain, totalPartTime, totalGross }` where `months` is `Array<{mainSalary:number, partTime:Array<{amount:number}>}>`
  - `sumReliefs(reliefs): number` — each capped at its `limit`
  - `sumPcb(pcbPaid): number`
  - `computeTax(profile): TaxResult` where `TaxResult = { totalMain, totalPartTime, totalGross, totalReliefs, chargeableIncome, grossTax, breakdown, pcbPaid, balance, isRefund, effectiveRate }`
  - `profile` shape per the design spec (`income.months`, `reliefs`, `pcbPaid`, optional `settings.taxBrackets`).

- [ ] **Step 1: Write the failing tests**

`src/engine/tax.test.js`:
```js
import { calcGrossTax, sumIncome, sumReliefs, sumPcb, computeTax } from './tax.js'

test('calcGrossTax is progressive across brackets', () => {
  // 30000 chargeable: 0% on first 5000, 1% on next 15000 (150), 3% on next 10000 (300) = 450
  const { total } = calcGrossTax(30000)
  expect(total).toBeCloseTo(450, 2)
})

test('calcGrossTax returns 0 at or below 5000', () => {
  expect(calcGrossTax(5000).total).toBeCloseTo(0, 2)
  expect(calcGrossTax(0).total).toBeCloseTo(0, 2)
})

test('calcGrossTax breakdown only includes brackets with taxable amount', () => {
  const { breakdown } = calcGrossTax(30000)
  const taxedBands = breakdown.filter(b => b.taxable > 0)
  expect(taxedBands.length).toBe(3)
})

test('sumIncome totals main and part-time', () => {
  const months = [
    { mainSalary: 3100, partTime: [{ amount: 333.33 }] },
    { mainSalary: 4500, partTime: [{ amount: 1000 }, { amount: 1000 }] },
  ]
  const r = sumIncome(months)
  expect(r.totalMain).toBeCloseTo(7600, 2)
  expect(r.totalPartTime).toBeCloseTo(2333.33, 2)
  expect(r.totalGross).toBeCloseTo(9933.33, 2)
})

test('sumReliefs caps each relief at its limit', () => {
  const reliefs = [
    { amount: 9000, limit: 9000 },
    { amount: 5000, limit: 2500 }, // over limit -> 2500
  ]
  expect(sumReliefs(reliefs)).toBeCloseTo(11500, 2)
})

test('sumPcb totals payments', () => {
  expect(sumPcb([{ amount: 79.35 }, { amount: 468.90 }])).toBeCloseTo(548.25, 2)
})

test('computeTax produces a refund when PCB exceeds gross tax', () => {
  const profile = {
    income: { months: [{ mainSalary: 30000, partTime: [] }] },
    reliefs: [{ amount: 9000, limit: 9000 }],
    pcbPaid: [{ amount: 1000 }],
  }
  // chargeable = 30000-9000 = 21000 -> 0 + 150 + 30 = 180 gross tax
  const r = computeTax(profile)
  expect(r.chargeableIncome).toBeCloseTo(21000, 2)
  expect(r.grossTax).toBeCloseTo(180, 2)
  expect(r.balance).toBeCloseTo(-820, 2)
  expect(r.isRefund).toBe(true)
})
```

- [ ] **Step 2: Run tests, verify they fail**

Run: `npx vitest run src/engine/tax.test.js`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement the engine**

`src/engine/tax.js`:
```js
import { TAX_BRACKETS } from './constants.js'

export function calcGrossTax(chargeableIncome, brackets = TAX_BRACKETS) {
  const income = Math.max(0, chargeableIncome)
  let total = 0
  const breakdown = brackets.map((b) => {
    const upper = b.max == null ? Infinity : b.max
    const taxable = Math.max(0, Math.min(income, upper) - b.min)
    const tax = taxable * b.rate
    total += tax
    return { min: b.min, max: b.max, rate: b.rate, taxable, tax }
  })
  return { total, breakdown }
}

export function sumIncome(months = []) {
  let totalMain = 0
  let totalPartTime = 0
  for (const m of months) {
    totalMain += m.mainSalary || 0
    for (const p of m.partTime || []) totalPartTime += p.amount || 0
  }
  return { totalMain, totalPartTime, totalGross: totalMain + totalPartTime }
}

export function sumReliefs(reliefs = []) {
  return reliefs.reduce((sum, r) => {
    const capped = r.limit != null ? Math.min(r.amount || 0, r.limit) : (r.amount || 0)
    return sum + capped
  }, 0)
}

export function sumPcb(pcbPaid = []) {
  return pcbPaid.reduce((sum, p) => sum + (p.amount || 0), 0)
}

export function computeTax(profile) {
  const brackets = profile?.settings?.taxBrackets || TAX_BRACKETS
  const { totalMain, totalPartTime, totalGross } = sumIncome(profile?.income?.months)
  const totalReliefs = sumReliefs(profile?.reliefs)
  const chargeableIncome = Math.max(0, totalGross - totalReliefs)
  const { total: grossTax, breakdown } = calcGrossTax(chargeableIncome, brackets)
  const pcbPaid = sumPcb(profile?.pcbPaid)
  const balance = grossTax - pcbPaid
  return {
    totalMain, totalPartTime, totalGross, totalReliefs,
    chargeableIncome, grossTax, breakdown, pcbPaid,
    balance, isRefund: balance < 0,
    effectiveRate: totalGross > 0 ? grossTax / totalGross : 0,
  }
}
```

- [ ] **Step 4: Run tests, verify they pass**

Run: `npx vitest run src/engine/tax.test.js`
Expected: PASS (all 7).

- [ ] **Step 5: Commit**

```bash
git add src/engine/tax.js src/engine/tax.test.js
git commit -m "feat: add core tax engine (chargeable income, brackets, balance)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 5: Default profile seed data

**Files:**
- Create: `src/data/defaultProfile.js`
- Test: `src/data/defaultProfile.test.js`

**Interfaces:**
- Consumes: `computeTax` from tax engine.
- Produces:
  - `defaultProfile`: full `TaxProfile` populated with Ieskandar's 2026 figures (12 months main salary, Jan–Jun confirmed part-time + Jul–Dec projected ~1680, PCB paid, reliefs, settings).
  - `blankProfile`: same shape, zeroed months, empty pcb, default relief list with `amount: 0` (personal relief 9000 kept).
  - `RELIEF_TEMPLATE`: array of `{key,label,amount,limit,auto?}`.

- [ ] **Step 1: Write the failing test**

`src/data/defaultProfile.test.js`:
```js
import { defaultProfile, blankProfile } from './defaultProfile.js'
import { computeTax } from '../engine/tax.js'

test('default profile has 12 months', () => {
  expect(defaultProfile.income.months).toHaveLength(12)
})

test('default profile gross is in the expected ~72.5k range', () => {
  const r = computeTax(defaultProfile)
  expect(r.totalGross).toBeGreaterThan(68000)
  expect(r.totalGross).toBeLessThan(78000)
})

test('default profile PCB paid totals 627.45', () => {
  const r = computeTax(defaultProfile)
  expect(r.pcbPaid).toBeCloseTo(627.45, 2)
})

test('blank profile has zero gross', () => {
  const r = computeTax(blankProfile)
  expect(r.totalGross).toBe(0)
})
```

- [ ] **Step 2: Run test, verify it fails**

Run: `npx vitest run src/data/defaultProfile.test.js`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement seed data**

`src/data/defaultProfile.js`:
```js
import { TAX_BRACKETS } from '../engine/constants.js'

const mainSalaries = [3100, 4500, 4500, 4000, 4500, 4000, 4500, 4500, 4500, 4500, 4500, 4500]

// Jan–Jun confirmed part-time; Jul–Dec projected ~1680
const partTimeByMonth = [
  [{ date: '2026-01-15', amount: 333.33, note: 'Different bank account' }],
  [{ date: '2026-02-15', amount: 2000, note: 'Excludes RM300 personal transfer from Umiii' }],
  [{ date: '2026-03-01', amount: 1000, note: '' }, { date: '2026-03-15', amount: 1110.80, note: '' }],
  [{ date: '2026-04-01', amount: 1000, note: '' }, { date: '2026-04-15', amount: 1000, note: '' }],
  [{ date: '2026-05-01', amount: 1000, note: '' }, { date: '2026-05-15', amount: 1000, note: '' }],
  [{ date: '2026-06-01', amount: 1638.11, note: 'One payment confirmed' }],
  ...Array.from({ length: 6 }, (_, i) => [
    { date: `2026-0${i + 7}-01`.replace('2026-010', '2026-10').replace('2026-011', '2026-11').replace('2026-012', '2026-12'), amount: 1680, note: 'Projected' },
  ]),
]

const monthNames = ['01','02','03','04','05','06','07','08','09','10','11','12']

export const defaultProfile = {
  settings: {
    taxYear: 2026,
    residentStatus: 'resident',
    maritalStatus: 'single',
    theme: 'system',
    taxBrackets: TAX_BRACKETS,
  },
  income: {
    months: monthNames.map((mm, i) => ({
      month: `2026-${mm}`,
      mainSalary: mainSalaries[i],
      partTime: partTimeByMonth[i] || [],
    })),
  },
  pcbPaid: [
    { month: '2026-01', amount: 0, ref: '' },
    { month: '2026-02', amount: 79.35, ref: '20-EM2600402490' },
    { month: '2026-03', amount: 79.20, ref: '20-EM2600592304' },
    { month: '2026-04', amount: 0, ref: '' },
    { month: '2026-05', amount: 468.90, ref: '20-EM2601013855 (catch-up)' },
  ],
  reliefs: [
    { key: 'personal', label: 'Personal relief', amount: 9000, limit: 9000, auto: true },
    { key: 'epf_life', label: 'EPF + Life insurance', amount: 360, limit: 7000 },
    { key: 'lifestyle', label: 'Lifestyle (WiFi, phone, etc.)', amount: 2500, limit: 2500 },
    { key: 'socso', label: 'SOCSO/EIS contribution', amount: 237, limit: 350 },
    { key: 'sspn', label: 'SSPN net deposit', amount: 0, limit: 8000 },
    { key: 'medical', label: 'Medical checkup', amount: 0, limit: 1000 },
  ],
}

export const RELIEF_TEMPLATE = defaultProfile.reliefs.map((r) => ({ ...r, amount: r.auto ? r.amount : 0 }))

export const blankProfile = {
  settings: { taxYear: 2026, residentStatus: 'resident', maritalStatus: 'single', theme: 'system', taxBrackets: TAX_BRACKETS },
  income: {
    months: monthNames.map((mm) => ({ month: `2026-${mm}`, mainSalary: 0, partTime: [] })),
  },
  pcbPaid: [],
  reliefs: RELIEF_TEMPLATE.map((r) => ({ ...r })),
}
```

> Note: the Jul–Dec date generator above must produce valid `2026-07`..`2026-12` dates. If the `.replace` chain is awkward, replace the spread with an explicit array of six `[{ date: '2026-07-01', amount: 1680, note: 'Projected' }]` … `'2026-12-01'` entries. Prefer the explicit array for clarity.

- [ ] **Step 4: Run test, verify it passes**

Run: `npx vitest run src/data/defaultProfile.test.js`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/data/defaultProfile.js src/data/defaultProfile.test.js
git commit -m "feat: add default (Ieskandar 2026) and blank seed profiles

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 6: Persistence hook & profile context

**Files:**
- Create: `src/hooks/useLocalStorage.js`, `src/hooks/useProfile.js`
- Test: `src/hooks/useLocalStorage.test.jsx`

**Interfaces:**
- Produces:
  - `useLocalStorage(key, initialValue): [value, setValue]` — JSON-persisted, SSR-safe guard.
  - `ProfileProvider` (React context) wrapping children; seeds with `defaultProfile`.
  - `useProfile(): { profile, setProfile, result, resetToDefault, clearToBlank, exportJson, importJson }` where `result = computeTax(profile)` (memoized).

- [ ] **Step 1: Write the failing test**

`src/hooks/useLocalStorage.test.jsx`:
```jsx
import { renderHook, act } from '@testing-library/react'
import { useLocalStorage } from './useLocalStorage.js'

beforeEach(() => localStorage.clear())

test('returns initial value then persists updates', () => {
  const { result } = renderHook(() => useLocalStorage('k', { a: 1 }))
  expect(result.current[0]).toEqual({ a: 1 })
  act(() => result.current[1]({ a: 2 }))
  expect(result.current[0]).toEqual({ a: 2 })
  expect(JSON.parse(localStorage.getItem('k'))).toEqual({ a: 2 })
})

test('reads existing value from storage', () => {
  localStorage.setItem('k', JSON.stringify({ a: 99 }))
  const { result } = renderHook(() => useLocalStorage('k', { a: 1 }))
  expect(result.current[0]).toEqual({ a: 99 })
})
```

- [ ] **Step 2: Run test, verify it fails**

Run: `npx vitest run src/hooks/useLocalStorage.test.jsx`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement hooks**

`src/hooks/useLocalStorage.js`:
```js
import { useEffect, useState } from 'react'

export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const raw = typeof window !== 'undefined' ? window.localStorage.getItem(key) : null
      return raw != null ? JSON.parse(raw) : initialValue
    } catch {
      return initialValue
    }
  })

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch { /* ignore quota / unavailable */ }
  }, [key, value])

  return [value, setValue]
}
```

`src/hooks/useProfile.js`:
```jsx
import { createContext, useContext, useMemo } from 'react'
import { useLocalStorage } from './useLocalStorage.js'
import { defaultProfile, blankProfile } from '../data/defaultProfile.js'
import { computeTax } from '../engine/tax.js'

const ProfileContext = createContext(null)

export function ProfileProvider({ children }) {
  const [profile, setProfile] = useLocalStorage('tax-profile-2026', defaultProfile)
  const result = useMemo(() => computeTax(profile), [profile])

  const value = {
    profile,
    setProfile,
    result,
    resetToDefault: () => setProfile(defaultProfile),
    clearToBlank: () => setProfile(blankProfile),
    exportJson: () => JSON.stringify(profile, null, 2),
    importJson: (text) => {
      const parsed = JSON.parse(text)
      if (!parsed.income || !parsed.reliefs) throw new Error('Invalid profile file')
      setProfile(parsed)
    },
  }
  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
}

export function useProfile() {
  const ctx = useContext(ProfileContext)
  if (!ctx) throw new Error('useProfile must be used within ProfileProvider')
  return ctx
}
```

- [ ] **Step 4: Run test, verify it passes**

Run: `npx vitest run src/hooks/useLocalStorage.test.jsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/hooks/
git commit -m "feat: add localStorage hook and profile context

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 7: Theme toggle & shared UI components

**Files:**
- Create: `src/components/ThemeToggle.jsx`, `src/components/Card.jsx`, `src/components/StatCard.jsx`, `src/components/ProgressBar.jsx`, `src/components/Footer.jsx`
- Modify: `src/styles/app.css` (append component styles)
- Test: `src/components/StatCard.test.jsx`

**Interfaces:**
- Consumes: `formatRM` from format.
- Produces:
  - `<ThemeToggle/>` — toggles `document.documentElement[data-theme]`, persisted via `useLocalStorage('theme', 'system')`.
  - `<Card>{children}</Card>`, `<StatCard label value accent hint/>`
  - `<ProgressBar value max accent/>`
  - `<Footer/>` — disclaimer text.

- [ ] **Step 1: Write the failing test**

`src/components/StatCard.test.jsx`:
```jsx
import { render, screen } from '@testing-library/react'
import StatCard from './StatCard.jsx'

test('StatCard shows label and value', () => {
  render(<StatCard label="Gross" value="RM 72,500.00" />)
  expect(screen.getByText('Gross')).toBeInTheDocument()
  expect(screen.getByText('RM 72,500.00')).toBeInTheDocument()
})
```

- [ ] **Step 2: Run test, verify it fails**

Run: `npx vitest run src/components/StatCard.test.jsx`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement components + styles**

`src/components/Card.jsx`:
```jsx
export default function Card({ children, className = '', ...rest }) {
  return <div className={`card ${className}`} {...rest}>{children}</div>
}
```

`src/components/StatCard.jsx`:
```jsx
export default function StatCard({ label, value, accent = 'primary', hint }) {
  return (
    <div className="card stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={{ color: `var(--${accent})` }}>{value}</div>
      {hint && <div className="stat-hint">{hint}</div>}
    </div>
  )
}
```

`src/components/ProgressBar.jsx`:
```jsx
export default function ProgressBar({ value, max, accent = 'primary' }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  return (
    <div className="progress" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
      <span style={{ width: `${pct}%`, background: `var(--${accent})` }} />
    </div>
  )
}
```

`src/components/ThemeToggle.jsx`:
```jsx
import { useEffect } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage.js'

export default function ThemeToggle() {
  const [theme, setTheme] = useLocalStorage('theme', 'light')
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])
  return (
    <button className="theme-toggle" aria-label="Toggle dark mode"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  )
}
```

`src/components/Footer.jsx`:
```jsx
export default function Footer() {
  return (
    <footer className="footer">
      Estimates for personal planning only — not official tax advice.
      Consult a licensed tax agent (ejen cukai) and verify figures on mytax.hasil.gov.my.
    </footer>
  )
}
```

Append to `src/styles/app.css`:
```css
.card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 18px; box-shadow: var(--shadow); }
.stat-card { display: flex; flex-direction: column; gap: 4px; }
.stat-label { font-size: 12px; text-transform: uppercase; letter-spacing: .04em; color: var(--muted); }
.stat-value { font-size: 24px; font-weight: 700; }
.stat-hint { font-size: 12px; color: var(--muted); }
.progress { height: 10px; background: var(--border); border-radius: 20px; overflow: hidden; }
.progress > span { display: block; height: 100%; border-radius: 20px; transition: width .3s; }
.theme-toggle { background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 6px 10px; cursor: pointer; font-size: 16px; }
.footer { text-align: center; color: var(--muted); font-size: 12px; padding: 28px 16px; max-width: 640px; margin: 0 auto; }
.grid { display: grid; gap: 16px; }
.grid-2 { grid-template-columns: repeat(2, 1fr); }
.grid-3 { grid-template-columns: repeat(3, 1fr); }
@media (max-width: 640px) { .grid-2, .grid-3 { grid-template-columns: 1fr; } }
```

- [ ] **Step 4: Run test, verify it passes**

Run: `npx vitest run src/components/StatCard.test.jsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/ src/styles/app.css
git commit -m "feat: add theme toggle and shared UI components

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 8: App shell & responsive navigation

**Files:**
- Modify: `src/App.jsx`
- Create: `src/components/Nav.jsx`
- Modify: `src/styles/app.css` (append nav styles)
- Test: `src/components/Nav.test.jsx`

**Interfaces:**
- Consumes: `ProfileProvider`, `ThemeToggle`, `Footer`, page components (placeholders until later tasks).
- Produces: routed app with nav links to `/`, `/income`, `/reliefs`, `/calc`, `/guide`. `Nav` renders 5 `NavLink`s with labels: Dashboard, Income, Reliefs, Tax Calc, BE Guide.

- [ ] **Step 1: Write the failing test**

`src/components/Nav.test.jsx`:
```jsx
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Nav from './Nav.jsx'

test('renders all five navigation links', () => {
  render(<MemoryRouter><Nav /></MemoryRouter>)
  for (const label of ['Dashboard', 'Income', 'Reliefs', 'Tax Calc', 'BE Guide']) {
    expect(screen.getByText(label)).toBeInTheDocument()
  }
})
```

- [ ] **Step 2: Run test, verify it fails**

Run: `npx vitest run src/components/Nav.test.jsx`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement Nav, App shell, styles**

`src/components/Nav.jsx`:
```jsx
import { NavLink } from 'react-router-dom'

const links = [
  { to: '/', label: 'Dashboard', icon: '📊', end: true },
  { to: '/income', label: 'Income', icon: '💰' },
  { to: '/reliefs', label: 'Reliefs', icon: '🎯' },
  { to: '/calc', label: 'Tax Calc', icon: '🧮' },
  { to: '/guide', label: 'BE Guide', icon: '📋' },
]

export default function Nav() {
  return (
    <nav className="nav">
      <div className="nav-brand">Tax<span>26</span></div>
      <div className="nav-links">
        {links.map((l) => (
          <NavLink key={l.to} to={l.to} end={l.end}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <span className="nav-icon" aria-hidden="true">{l.icon}</span>
            <span className="nav-label">{l.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
```

`src/App.jsx`:
```jsx
import { Routes, Route } from 'react-router-dom'
import { ProfileProvider } from './hooks/useProfile.js'
import Nav from './components/Nav.jsx'
import ThemeToggle from './components/ThemeToggle.jsx'
import Footer from './components/Footer.jsx'
import Dashboard from './pages/Dashboard.jsx'
import IncomeLog from './pages/IncomeLog.jsx'
import Reliefs from './pages/Reliefs.jsx'
import TaxCalc from './pages/TaxCalc.jsx'
import BorangGuide from './pages/BorangGuide.jsx'

export default function App() {
  return (
    <ProfileProvider>
      <div className="app">
        <Nav />
        <main className="main">
          <div className="topbar"><ThemeToggle /></div>
          <div className="container">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/income" element={<IncomeLog />} />
              <Route path="/reliefs" element={<Reliefs />} />
              <Route path="/calc" element={<TaxCalc />} />
              <Route path="/guide" element={<BorangGuide />} />
            </Routes>
          </div>
          <Footer />
        </main>
      </div>
    </ProfileProvider>
  )
}
```

Create placeholder pages so the app compiles (each replaced in later tasks):

`src/pages/Dashboard.jsx`, `IncomeLog.jsx`, `Reliefs.jsx`, `TaxCalc.jsx`, `BorangGuide.jsx` — each:
```jsx
export default function Page() {
  return <h2 className="page-title">Coming soon</h2>
}
```
(Use a distinct default function name per file, e.g. `Dashboard`, `IncomeLog`, etc.)

Append to `src/styles/app.css`:
```css
.app { display: flex; min-height: 100vh; }
.main { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.topbar { display: flex; justify-content: flex-end; padding: 14px 24px 0; }
.nav { width: 220px; background: var(--surface); border-right: 1px solid var(--border); padding: 18px 14px; display: flex; flex-direction: column; gap: 18px; position: sticky; top: 0; height: 100vh; }
.nav-brand { font-size: 22px; font-weight: 800; color: var(--primary); }
.nav-brand span { color: var(--text); }
.nav-links { display: flex; flex-direction: column; gap: 4px; }
.nav-link { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 10px; text-decoration: none; color: var(--muted); font-weight: 600; }
.nav-link:hover { background: var(--bg); color: var(--text); }
.nav-link.active { background: var(--primary); color: #fff; }
.nav-icon { font-size: 16px; }

@media (max-width: 720px) {
  .app { flex-direction: column; }
  .nav { width: auto; height: auto; flex-direction: row; position: fixed; bottom: 0; left: 0; right: 0; top: auto; border-right: none; border-top: 1px solid var(--border); padding: 8px; z-index: 50; justify-content: center; }
  .nav-brand { display: none; }
  .nav-links { flex-direction: row; width: 100%; justify-content: space-around; gap: 0; }
  .nav-link { flex-direction: column; gap: 2px; font-size: 10px; padding: 6px 8px; }
  .nav-link.active { background: transparent; color: var(--primary); }
  .main { padding-bottom: 64px; }
}
```

- [ ] **Step 4: Run tests, verify they pass**

Run: `npx vitest run` (full suite) then `npm run build`
Expected: all tests PASS; build succeeds.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add responsive app shell and navigation

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 9: Dashboard page

**Files:**
- Modify: `src/pages/Dashboard.jsx`
- Test: `src/pages/Dashboard.test.jsx`

**Interfaces:**
- Consumes: `useProfile().result`, `StatCard`, `formatRM`, `formatPct`, Recharts.
- Produces: hero balance card (due/refund), stat cards (gross, chargeable, PCB paid, effective rate), a monthly income bar chart, and an encouraging tracked-months note.

- [ ] **Step 1: Write the failing test**

`src/pages/Dashboard.test.jsx`:
```jsx
import { render, screen } from '@testing-library/react'
import { ProfileProvider } from '../hooks/useProfile.js'
import Dashboard from './Dashboard.jsx'

function wrap(ui) { return <ProfileProvider>{ui}</ProfileProvider> }

beforeEach(() => localStorage.clear())

test('shows hero balance and key stat labels', () => {
  render(wrap(<Dashboard />))
  expect(screen.getByText(/Total Gross/i)).toBeInTheDocument()
  expect(screen.getByText(/Effective Rate/i)).toBeInTheDocument()
  // Hero card states either Balance Due or Refund
  expect(screen.getByText(/Balance Due|Refund/i)).toBeInTheDocument()
})
```

- [ ] **Step 2: Run test, verify it fails**

Run: `npx vitest run src/pages/Dashboard.test.jsx`
Expected: FAIL ("Coming soon" placeholder, labels absent).

- [ ] **Step 3: Implement Dashboard**

`src/pages/Dashboard.jsx`:
```jsx
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { useProfile } from '../hooks/useProfile.js'
import StatCard from '../components/StatCard.jsx'
import { formatRM, formatPct } from '../engine/format.js'

export default function Dashboard() {
  const { profile, result } = useProfile()
  const months = profile.income.months
  const tracked = months.filter((m) => m.mainSalary > 0 || m.partTime.length > 0).length
  const chartData = months.map((m) => ({
    name: m.month.slice(5),
    main: m.mainSalary,
    part: m.partTime.reduce((s, p) => s + p.amount, 0),
  }))
  const refund = result.isRefund

  return (
    <div>
      <h2 className="page-title">Dashboard</h2>
      <p className="subtitle">Your 2026 tax at a glance.</p>

      <div className={`card hero ${refund ? 'hero-positive' : ''}`}>
        <div className="stat-label">{refund ? 'Estimated Refund' : 'Estimated Balance Due'}</div>
        <div className="hero-value" style={{ color: refund ? 'var(--positive)' : 'var(--text)' }}>
          {formatRM(Math.abs(result.balance))}
        </div>
        <div className="stat-hint">{refund ? 'You may get this back' : 'Payable at e-Filing, April 2027'}</div>
      </div>

      <div className="grid grid-3" style={{ marginTop: 16 }}>
        <StatCard label="Total Gross" value={formatRM(result.totalGross)} />
        <StatCard label="Chargeable Income" value={formatRM(result.chargeableIncome)} accent="warn" />
        <StatCard label="PCB Paid" value={formatRM(result.pcbPaid)} accent="positive" />
      </div>
      <div className="grid grid-2" style={{ marginTop: 16 }}>
        <StatCard label="Gross Tax" value={formatRM(result.grossTax)} />
        <StatCard label="Effective Rate" value={formatPct(result.effectiveRate)} accent="warn"
          hint={`${tracked}/12 months tracked — keep it up!`} />
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="stat-label">Monthly income</div>
        <div style={{ width: '100%', height: 260 }}>
          <ResponsiveContainer>
            <BarChart data={chartData}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => formatRM(v)} />
              <Bar dataKey="main" stackId="a" fill="var(--primary)" name="Main" />
              <Bar dataKey="part" stackId="a" fill="var(--warn)" name="Part-time" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
```

Append to `src/styles/app.css`:
```css
.hero { text-align: center; padding: 30px; }
.hero-value { font-size: 44px; font-weight: 800; margin: 6px 0; }
.hero-positive { border-color: var(--positive); }
```

- [ ] **Step 4: Run test, verify it passes**

Run: `npx vitest run src/pages/Dashboard.test.jsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/pages/Dashboard.jsx src/pages/Dashboard.test.jsx src/styles/app.css
git commit -m "feat: implement dashboard page with charts and stats

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 10: Income Log page

**Files:**
- Modify: `src/pages/IncomeLog.jsx`
- Test: `src/pages/IncomeLog.test.jsx`

**Interfaces:**
- Consumes: `useProfile()` (`profile`, `setProfile`), `formatRM`.
- Produces: editable monthly table. Editing a main salary updates `profile.income.months[i].mainSalary`; "Add payment" appends a part-time entry; delete removes one. Shows per-month totals and grand totals.

- [ ] **Step 1: Write the failing test**

`src/pages/IncomeLog.test.jsx`:
```jsx
import { render, screen, fireEvent } from '@testing-library/react'
import { ProfileProvider, useProfile } from '../hooks/useProfile.js'
import IncomeLog from './IncomeLog.jsx'

beforeEach(() => localStorage.clear())

test('editing a main salary updates the running total', () => {
  render(<ProfileProvider><IncomeLog /></ProfileProvider>)
  const firstInput = screen.getAllByLabelText(/main salary/i)[0]
  fireEvent.change(firstInput, { target: { value: '5000' } })
  expect(firstInput.value).toBe('5000')
})
```

- [ ] **Step 2: Run test, verify it fails**

Run: `npx vitest run src/pages/IncomeLog.test.jsx`
Expected: FAIL (placeholder).

- [ ] **Step 3: Implement IncomeLog**

`src/pages/IncomeLog.jsx`:
```jsx
import { useProfile } from '../hooks/useProfile.js'
import { formatRM } from '../engine/format.js'

export default function IncomeLog() {
  const { profile, setProfile } = useProfile()
  const months = profile.income.months

  const update = (next) => setProfile({ ...profile, income: { ...profile.income, months: next } })

  const setMain = (i, val) => {
    const next = months.map((m, idx) => idx === i ? { ...m, mainSalary: parseFloat(val) || 0 } : m)
    update(next)
  }
  const addPart = (i) => {
    const next = months.map((m, idx) => idx === i
      ? { ...m, partTime: [...m.partTime, { date: `${m.month}-01`, amount: 0, note: '' }] } : m)
    update(next)
  }
  const setPart = (i, j, field, val) => {
    const next = months.map((m, idx) => {
      if (idx !== i) return m
      const pt = m.partTime.map((p, pj) => pj === j
        ? { ...p, [field]: field === 'amount' ? (parseFloat(val) || 0) : val } : p)
      return { ...m, partTime: pt }
    })
    update(next)
  }
  const delPart = (i, j) => {
    const next = months.map((m, idx) => idx === i
      ? { ...m, partTime: m.partTime.filter((_, pj) => pj !== j) } : m)
    update(next)
  }

  const monthTotal = (m) => m.mainSalary + m.partTime.reduce((s, p) => s + p.amount, 0)
  const grand = months.reduce((s, m) => s + monthTotal(m), 0)

  return (
    <div>
      <h2 className="page-title">Income Log</h2>
      <p className="subtitle">Track main salary and part-time payments (1st &amp; 15th DuitNow).</p>

      {months.map((m, i) => (
        <div className="card income-month" key={m.month}>
          <div className="income-head">
            <strong>{m.month}</strong>
            <span className="stat-hint">Total: {formatRM(monthTotal(m))}</span>
          </div>
          <label className="field">
            <span>Main salary (gross)</span>
            <input type="number" aria-label={`main salary ${m.month}`}
              value={m.mainSalary} onChange={(e) => setMain(i, e.target.value)} />
          </label>
          {m.partTime.map((p, j) => (
            <div className="part-row" key={j}>
              <input type="date" aria-label={`part date ${m.month} ${j}`}
                value={p.date} onChange={(e) => setPart(i, j, 'date', e.target.value)} />
              <input type="number" aria-label={`part amount ${m.month} ${j}`}
                value={p.amount} onChange={(e) => setPart(i, j, 'amount', e.target.value)} />
              <input type="text" placeholder="note" aria-label={`part note ${m.month} ${j}`}
                value={p.note} onChange={(e) => setPart(i, j, 'note', e.target.value)} />
              <button onClick={() => delPart(i, j)} aria-label="delete payment">✕</button>
            </div>
          ))}
          <button className="btn-secondary" onClick={() => addPart(i)}>+ Add part-time payment</button>
        </div>
      ))}

      <div className="card" style={{ marginTop: 16 }}>
        <strong>Grand total income: {formatRM(grand)}</strong>
      </div>
    </div>
  )
}
```

Append to `src/styles/app.css`:
```css
.income-month { margin-bottom: 14px; }
.income-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.field { display: flex; flex-direction: column; gap: 4px; margin-bottom: 10px; font-size: 13px; color: var(--muted); }
.field input, .part-row input { background: var(--bg); border: 1px solid var(--border); border-radius: 8px; padding: 8px 10px; color: var(--text); font-size: 14px; }
.part-row { display: grid; grid-template-columns: 1.2fr 1fr 1.6fr auto; gap: 8px; margin-bottom: 8px; }
.part-row button { background: transparent; border: 1px solid var(--border); border-radius: 8px; cursor: pointer; color: var(--muted); }
.btn-secondary { background: var(--bg); border: 1px solid var(--border); border-radius: 8px; padding: 8px 12px; cursor: pointer; color: var(--primary); font-weight: 600; }
@media (max-width: 640px) { .part-row { grid-template-columns: 1fr 1fr; } }
```

- [ ] **Step 4: Run test, verify it passes**

Run: `npx vitest run src/pages/IncomeLog.test.jsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/pages/IncomeLog.jsx src/pages/IncomeLog.test.jsx src/styles/app.css
git commit -m "feat: implement income log page with editable entries

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 11: Reliefs page

**Files:**
- Modify: `src/pages/Reliefs.jsx`
- Test: `src/pages/Reliefs.test.jsx`

**Interfaces:**
- Consumes: `useProfile()`, `ProgressBar`, `formatRM`, `computeTax` (for what-if savings).
- Produces: editable relief list with limit progress bars and an optimization hint per relief that has headroom (estimated tax saved if topped up to limit).

- [ ] **Step 1: Write the failing test**

`src/pages/Reliefs.test.jsx`:
```jsx
import { render, screen, fireEvent } from '@testing-library/react'
import { ProfileProvider } from '../hooks/useProfile.js'
import Reliefs from './Reliefs.jsx'

beforeEach(() => localStorage.clear())

test('lists reliefs and allows editing an amount', () => {
  render(<ProfileProvider><Reliefs /></ProfileProvider>)
  expect(screen.getByText(/Personal relief/i)).toBeInTheDocument()
  const sspn = screen.getByLabelText(/SSPN net deposit amount/i)
  fireEvent.change(sspn, { target: { value: '8000' } })
  expect(sspn.value).toBe('8000')
})
```

- [ ] **Step 2: Run test, verify it fails**

Run: `npx vitest run src/pages/Reliefs.test.jsx`
Expected: FAIL (placeholder).

- [ ] **Step 3: Implement Reliefs**

`src/pages/Reliefs.jsx`:
```jsx
import { useProfile } from '../hooks/useProfile.js'
import ProgressBar from '../components/ProgressBar.jsx'
import { formatRM } from '../engine/format.js'
import { computeTax } from '../engine/tax.js'

export default function Reliefs() {
  const { profile, setProfile, result } = useProfile()

  const setAmount = (key, val) => {
    const reliefs = profile.reliefs.map((r) => r.key === key
      ? { ...r, amount: parseFloat(val) || 0 } : r)
    setProfile({ ...profile, reliefs })
  }

  // What-if: tax saved if this relief is topped up to its limit.
  const savingIfMaxed = (relief) => {
    const headroom = (relief.limit ?? 0) - relief.amount
    if (headroom <= 0) return 0
    const bumped = {
      ...profile,
      reliefs: profile.reliefs.map((r) => r.key === relief.key ? { ...r, amount: relief.limit } : r),
    }
    return result.grossTax - computeTax(bumped).grossTax
  }

  return (
    <div>
      <h2 className="page-title">Reliefs</h2>
      <p className="subtitle">Maximise your reliefs to lower chargeable income.</p>

      {profile.reliefs.map((r) => {
        const saving = savingIfMaxed(r)
        return (
          <div className="card relief" key={r.key}>
            <div className="relief-head">
              <strong>{r.label}</strong>
              <span className="stat-hint">limit {formatRM(r.limit)}</span>
            </div>
            <label className="field">
              <span>Amount claimed</span>
              <input type="number" aria-label={`${r.label} amount`}
                value={r.amount} disabled={r.auto}
                onChange={(e) => setAmount(r.key, e.target.value)} />
            </label>
            <ProgressBar value={r.amount} max={r.limit}
              accent={r.amount >= r.limit ? 'positive' : 'primary'} />
            {saving > 0.5 && (
              <div className="relief-hint">
                💡 Top up to {formatRM(r.limit)} → save about {formatRM(saving)} in tax.
              </div>
            )}
          </div>
        )
      })}

      <div className="card" style={{ marginTop: 16 }}>
        <strong>Total reliefs: {formatRM(result.totalReliefs)}</strong>
      </div>
    </div>
  )
}
```

Append to `src/styles/app.css`:
```css
.relief { margin-bottom: 14px; }
.relief-head { display: flex; justify-content: space-between; margin-bottom: 8px; }
.relief-hint { margin-top: 10px; font-size: 13px; color: var(--warn); }
```

- [ ] **Step 4: Run test, verify it passes**

Run: `npx vitest run src/pages/Reliefs.test.jsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/pages/Reliefs.jsx src/pages/Reliefs.test.jsx src/styles/app.css
git commit -m "feat: implement reliefs page with limits and what-if savings

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 12: Tax Calc page (breakdown + scenario comparison)

**Files:**
- Modify: `src/pages/TaxCalc.jsx`
- Test: `src/pages/TaxCalc.test.jsx`

**Interfaces:**
- Consumes: `useProfile()`, `computeTax`, `formatRM`, `formatPct`.
- Produces: bracket-by-bracket table for the live profile, plus a side-by-side comparison of three scenarios computed from the current profile: "Main only", "Main + part-time" (current), "With reliefs maxed".

- [ ] **Step 1: Write the failing test**

`src/pages/TaxCalc.test.jsx`:
```jsx
import { render, screen } from '@testing-library/react'
import { ProfileProvider } from '../hooks/useProfile.js'
import TaxCalc from './TaxCalc.jsx'

beforeEach(() => localStorage.clear())

test('renders breakdown and three scenario columns', () => {
  render(<ProfileProvider><TaxCalc /></ProfileProvider>)
  expect(screen.getByText(/Tax Breakdown/i)).toBeInTheDocument()
  expect(screen.getByText(/Main only/i)).toBeInTheDocument()
  expect(screen.getByText(/Main \+ part-time/i)).toBeInTheDocument()
  expect(screen.getByText(/Reliefs maxed/i)).toBeInTheDocument()
})
```

- [ ] **Step 2: Run test, verify it fails**

Run: `npx vitest run src/pages/TaxCalc.test.jsx`
Expected: FAIL (placeholder).

- [ ] **Step 3: Implement TaxCalc**

`src/pages/TaxCalc.jsx`:
```jsx
import { useProfile } from '../hooks/useProfile.js'
import { computeTax } from '../engine/tax.js'
import { formatRM, formatPct } from '../engine/format.js'

export default function TaxCalc() {
  const { profile, result } = useProfile()

  const mainOnly = {
    ...profile,
    income: { months: profile.income.months.map((m) => ({ ...m, partTime: [] })) },
  }
  const maxed = {
    ...profile,
    reliefs: profile.reliefs.map((r) => ({ ...r, amount: r.limit ?? r.amount })),
  }
  const scenarios = [
    { name: 'Main only', r: computeTax(mainOnly) },
    { name: 'Main + part-time', r: result },
    { name: 'Reliefs maxed', r: computeTax(maxed) },
  ]

  return (
    <div>
      <h2 className="page-title">Tax Calculator</h2>
      <p className="subtitle">Transparent, bracket-by-bracket — no black box.</p>

      <div className="card">
        <div className="stat-label">Tax Breakdown (current)</div>
        <table className="tax-table">
          <thead>
            <tr><th>Band (RM)</th><th>Rate</th><th>Taxable</th><th>Tax</th></tr>
          </thead>
          <tbody>
            {result.breakdown.filter((b) => b.taxable > 0).map((b, i) => (
              <tr key={i}>
                <td>{b.min.toLocaleString()} – {b.max == null ? '∞' : b.max.toLocaleString()}</td>
                <td>{formatPct(b.rate)}</td>
                <td>{formatRM(b.taxable)}</td>
                <td>{formatRM(b.tax)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr><td colSpan="3"><strong>Gross tax</strong></td><td><strong>{formatRM(result.grossTax)}</strong></td></tr>
            <tr><td colSpan="3">PCB paid</td><td>{formatRM(result.pcbPaid)}</td></tr>
            <tr><td colSpan="3"><strong>{result.isRefund ? 'Refund' : 'Balance due'}</strong></td>
              <td><strong>{formatRM(Math.abs(result.balance))}</strong></td></tr>
          </tfoot>
        </table>
      </div>

      <h3 style={{ marginTop: 24 }}>Compare scenarios</h3>
      <div className="grid grid-3">
        {scenarios.map((s) => (
          <div className="card" key={s.name}>
            <div className="stat-label">{s.name}</div>
            <div className="scenario-row"><span>Gross</span><span>{formatRM(s.r.totalGross)}</span></div>
            <div className="scenario-row"><span>Chargeable</span><span>{formatRM(s.r.chargeableIncome)}</span></div>
            <div className="scenario-row"><span>Gross tax</span><span>{formatRM(s.r.grossTax)}</span></div>
            <div className="scenario-row"><span>Eff. rate</span><span>{formatPct(s.r.effectiveRate)}</span></div>
            <div className="scenario-row"><strong>{s.r.isRefund ? 'Refund' : 'Due'}</strong>
              <strong>{formatRM(Math.abs(s.r.balance))}</strong></div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

Append to `src/styles/app.css`:
```css
.tax-table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 14px; }
.tax-table th, .tax-table td { text-align: right; padding: 8px; border-bottom: 1px solid var(--border); }
.tax-table th:first-child, .tax-table td:first-child { text-align: left; }
.scenario-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; border-bottom: 1px solid var(--border); }
```

- [ ] **Step 4: Run test, verify it passes**

Run: `npx vitest run src/pages/TaxCalc.test.jsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/pages/TaxCalc.jsx src/pages/TaxCalc.test.jsx src/styles/app.css
git commit -m "feat: implement tax calc page with breakdown and scenarios

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 13: Borang BE Guide page + data management (export/import/reset)

**Files:**
- Modify: `src/pages/BorangGuide.jsx`
- Test: `src/pages/BorangGuide.test.jsx`

**Interfaces:**
- Consumes: `useProfile()` (`result`, `exportJson`, `importJson`, `resetToDefault`, `clearToBlank`), `formatRM`.
- Produces: step-by-step BE e-filing guide mapping live figures to form fields, deadline/payment info, a checklist, and data-management buttons (export downloads JSON, import reads a file, reset, clear).

- [ ] **Step 1: Write the failing test**

`src/pages/BorangGuide.test.jsx`:
```jsx
import { render, screen } from '@testing-library/react'
import { ProfileProvider } from '../hooks/useProfile.js'
import BorangGuide from './BorangGuide.jsx'

beforeEach(() => localStorage.clear())

test('shows e-filing steps, deadline, and data controls', () => {
  render(<ProfileProvider><BorangGuide /></ProfileProvider>)
  expect(screen.getByText(/Borang BE/i)).toBeInTheDocument()
  expect(screen.getByText(/30 April 2027/i)).toBeInTheDocument()
  expect(screen.getByText(/Export/i)).toBeInTheDocument()
  expect(screen.getByText(/Reset to my 2026 data/i)).toBeInTheDocument()
})
```

- [ ] **Step 2: Run test, verify it fails**

Run: `npx vitest run src/pages/BorangGuide.test.jsx`
Expected: FAIL (placeholder).

- [ ] **Step 3: Implement BorangGuide**

`src/pages/BorangGuide.jsx`:
```jsx
import { useRef } from 'react'
import { useProfile } from '../hooks/useProfile.js'
import { formatRM } from '../engine/format.js'

export default function BorangGuide() {
  const { result, exportJson, importJson, resetToDefault, clearToBlank } = useProfile()
  const fileRef = useRef(null)

  const download = () => {
    const blob = new Blob([exportJson()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'tax-profile-2026.json'; a.click()
    URL.revokeObjectURL(url)
  }
  const onFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try { importJson(String(reader.result)) }
      catch { alert('Invalid profile file.') }
    }
    reader.readAsText(file)
  }

  const steps = [
    { f: 'Bahagian B — Statutory income from employment', v: formatRM(result.totalGross),
      note: 'Include BOTH main salary and part-time (Nuvera) income here.' },
    { f: 'Bahagian C/D — Total reliefs', v: formatRM(result.totalReliefs),
      note: 'Personal RM9,000, lifestyle, life insurance/EPF, SOCSO, etc.' },
    { f: 'Chargeable income', v: formatRM(result.chargeableIncome),
      note: 'Auto-calculated = income − reliefs.' },
    { f: 'Tax charged', v: formatRM(result.grossTax), note: 'Per the resident tax schedule.' },
    { f: 'PCB / MTD already paid', v: formatRM(result.pcbPaid), note: 'From your MyTax ledger.' },
    { f: result.isRefund ? 'Refund due to you' : 'Balance of tax payable',
      v: formatRM(Math.abs(result.balance)),
      note: result.isRefund ? 'Ensure your bank account is updated in MyTax.' : 'Pay via FPX or JomPAY biller 30001.' },
  ]

  return (
    <div>
      <h2 className="page-title">Borang BE e-Filing Guide</h2>
      <p className="subtitle">Map your figures to the BE form. Deadline: <strong>30 April 2027</strong> · mytax.hasil.gov.my</p>

      <div className="card">
        <div className="stat-label">Field-by-field</div>
        <ol className="be-steps">
          {steps.map((s, i) => (
            <li key={i}>
              <div className="be-field"><strong>{s.f}</strong><span>{s.v}</span></div>
              <div className="stat-hint">{s.note}</div>
            </li>
          ))}
        </ol>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="stat-label">Before you file — checklist</div>
        <ul className="be-checklist">
          <li>Keep receipts: WiFi, insurance, phone purchase</li>
          <li>Consider SSPN deposit (up to RM8,000 relief)</li>
          <li>Consider a medical checkup before Dec 2026 (RM1,000 relief)</li>
          <li>Confirm bank account in MyTax profile (for refunds)</li>
        </ul>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="stat-label">Your data</div>
        <div className="data-actions">
          <button className="btn-secondary" onClick={download}>Export JSON</button>
          <button className="btn-secondary" onClick={() => fileRef.current?.click()}>Import JSON</button>
          <input ref={fileRef} type="file" accept="application/json" hidden onChange={onFile} />
          <button className="btn-secondary" onClick={resetToDefault}>Reset to my 2026 data</button>
          <button className="btn-secondary" onClick={clearToBlank}>Clear to blank</button>
        </div>
      </div>
    </div>
  )
}
```

Append to `src/styles/app.css`:
```css
.be-steps { padding-left: 18px; display: flex; flex-direction: column; gap: 14px; }
.be-field { display: flex; justify-content: space-between; gap: 12px; }
.be-checklist { padding-left: 18px; line-height: 1.9; }
.data-actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 10px; }
```

- [ ] **Step 4: Run test, verify it passes**

Run: `npx vitest run src/pages/BorangGuide.test.jsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/pages/BorangGuide.jsx src/pages/BorangGuide.test.jsx src/styles/app.css
git commit -m "feat: implement Borang BE guide and data import/export

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 14: Final verification & README

**Files:**
- Create: `README.md`
- Test: full suite + build

**Interfaces:** none new.

- [ ] **Step 1: Write `README.md`**

```markdown
# Tax Tracker 2026

A private, browser-only Malaysian personal income-tax tracker & calculator
(Vite + React). Data stays in your browser (localStorage). Pre-loaded with a
2026 profile; editable as a generic resident calculator.

## Develop
- `npm install`
- `npm run dev` — local dev server
- `npm test` — run the test suite
- `npm run build` — production static bundle in `dist/`

## Notes
Estimates for planning only — not official tax advice. Verify against the
official LHDN schedule and mytax.hasil.gov.my. Tax brackets are editable in
`src/engine/constants.js`.
```

- [ ] **Step 2: Run full test suite**

Run: `npx vitest run`
Expected: ALL tests pass.

- [ ] **Step 3: Run production build**

Run: `npm run build`
Expected: build succeeds, `dist/` produced, no errors.

- [ ] **Step 4: Manual smoke (document result)**

Run: `npm run dev`, open the app, click through all 5 pages, toggle dark mode, edit an income value, confirm dashboard updates and reload persists.
Expected: all interactions work; no console errors.

- [ ] **Step 5: Commit**

```bash
git add README.md
git commit -m "docs: add README and finalize app

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Self-Review Notes

**Spec coverage:** Tech/architecture (Tasks 1,6) · visual style + nav (Tasks 7,8) · data model (Tasks 5,6) · deductions (Task 3) · tax engine + brackets (Tasks 2,4) · all 5 pages (Tasks 9–13) · scenario compare (Task 12) · reliefs optimizer (Task 11) · export/import/reset (Task 13) · disclaimer (Task 7) · responsive/dark/accessible (Tasks 7,8 + per-page) · TDD throughout. All spec sections map to a task.

**Out-of-scope honored:** no backend, no MyTax API, no CSV import (noted as future), resident BE only.

**Type consistency:** `computeTax` returns the `TaxResult` shape used identically across Dashboard, Reliefs, TaxCalc, BorangGuide. `profile` shape consistent between `defaultProfile`, `blankProfile`, and all setters. Relief objects use `{key,label,amount,limit,auto}` everywhere.
