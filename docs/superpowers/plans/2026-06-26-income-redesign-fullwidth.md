# Income Redesign + Full-Width Layout Implementation Plan

> Implement task-by-task. Each task ends with passing tests + `npm run build` + a commit. Tasks are sequential (they share `src/styles/app.css`).

**Goal:** Make every page fill the screen and adapt to all sizes, and rebuild the Income page as an interactive, card-based, tabbed experience (month cards, featured current-month, live summary + mini chart, bulk actions).

**Architecture:** Pure CSS layout changes + reworked page grids (Phase A). New React components Tabs/MonthCard + pure `incomeBulk` helpers (Phase B). Tax engine & data model unchanged (`monthOverrides[m]={mainSalary?,partTime?,confirmed?}`, `pcbPaid[]`); writes go through `useProfile().setYear` → encrypted vault.

**Tech Stack:** Vite, React 18 (JSX), Recharts, Vitest + Testing Library.

## Global Constraints
- Neo-Lux tokens only (`--paper/--surface/--ink/--gold/--pink/--positive/--muted/--border`); **no** stale `--primary/--warn/--text/--bg`.
- Content fills to a **comfortable max-width 1560px**; fluid side padding `clamp(16px,4vw,48px)`; no horizontal overflow at 320px.
- Engine pure & unchanged; all data encrypted at rest; existing tests stay green (update selectors only where markup changed).
- Commit each task; message ends `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`; repo has no git user → `git -c user.name="Ieskandar" -c user.email="nuverarosecompany@gmail.com" commit`.
- Run full suite (`npx vitest run`) + `npm run build` before each commit.

---

# PHASE A — Full-width responsive layout

## Task A1: Layout foundation (container + grid utilities)
**Files:** Modify `src/styles/app.css`.
- Change `.container` to: `width:100%; max-width:1560px; margin:0 auto; padding:24px clamp(16px,4vw,48px);`
- Update `.topbar` horizontal padding to match: `padding:14px clamp(16px,4vw,48px) 0;`
- Add utilities:
  - `.grid-auto{ display:grid; gap:16px; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); }`
  - `.grid-auto-wide{ display:grid; gap:16px; grid-template-columns:repeat(auto-fit,minmax(320px,1fr)); }`
  - `.split-2{ display:grid; gap:16px; grid-template-columns:1fr; } @media(min-width:1024px){ .split-2{ grid-template-columns:2fr 1fr; } }`
- [ ] No test (CSS only). Run `npm run build` (succeeds) + `npx vitest run` (all still green). Manually confirm no rule duplication. Commit `style: fluid full-width container + responsive grid utilities`.

## Task A2: Dashboard fills width
**Files:** Modify `src/pages/Dashboard.jsx`, `src/styles/app.css`; update `src/pages/Dashboard.test.jsx` only if selectors change.
- Replace the stat `.grid grid-3` / `grid-2` blocks with `.grid-auto` so stat cards auto-fill (4-up wide → 1-up phone). Keep all existing StatCards/labels/values (tests assert these texts — keep them).
- Put the **Monthly income chart** and the **SavingsCard** in a `.split-2` (chart left 2fr, savings right 1fr) on ≥1024px, stacked below.
- Keep hero full-width and the actual-indicator line.
- [ ] Keep `Dashboard.test.jsx` green (labels unchanged). Run suite + build. Commit `style: dashboard fills width (auto-fill stats, chart+savings split)`.

## Task A3: Reliefs + Settings multi-column
**Files:** Modify `src/pages/Reliefs.jsx`, `src/pages/Settings.jsx`, `src/styles/app.css`; keep their tests green.
- Reliefs: wrap the relief cards in a `.grid-auto-wide` container (2–3 per row wide, 1 narrow); the total-reliefs bar spans full width below.
- Settings: wrap the `.settings-section` cards in a `.grid-auto-wide` (2-col wide, 1 narrow). Keep all section headings/controls (tests assert them).
- [ ] Reliefs.test.jsx + Settings.test.jsx stay green. Run suite + build. Commit `style: reliefs and settings use multi-column grids`.

## Task A4: Tax Calc side-by-side
**Files:** Modify `src/pages/TaxCalc.jsx`, `src/styles/app.css`; keep TaxCalc.test.jsx green.
- On ≥1024px: bracket-breakdown card left, the three scenario cards stacked in a right column (`grid-template-columns:1.3fr 1fr` via a new `.taxcalc-split` class). Below `lg`: stacked (breakdown, then scenarios in a `.grid-auto-wide` row).
- Keep all labels/headings/figures (tests assert "Tax Breakdown", scenario names, etc.).
- [ ] TaxCalc.test.jsx stays green. Run suite + build. Commit `style: tax calc breakdown + scenarios side-by-side on wide`.

## Task A5: BE Guide readable widened layout
**Files:** Modify `src/pages/BorangGuide.jsx`, `src/styles/app.css`; keep BorangGuide.test.jsx green.
- Wrap prose sections in a readable measure (`max-width:72ch`) but place the **field-mapping** block and the **checklist** side-by-side on ≥1024px (a `.guide-split` 2-col grid), stacked on narrow. Page still uses the fluid container.
- Keep all section text (tests assert "Documents", "Bahagian B", "30 April 2027", "JomPAY", "Umiii", penalties).
- [ ] BorangGuide.test.jsx stays green. Run suite + build. Commit `style: BE guide widened, readable two-column layout`.

---

# PHASE B — Interactive card-based Income page

## Task B1: Tabs component + Income tab shell
**Files:** Create `src/components/Tabs.jsx`, `src/components/Tabs.test.jsx`; Modify `src/pages/Income.jsx`, `src/styles/app.css`.
**Interfaces:** `<Tabs tabs={[{id,label}]} active onChange>` — `role="tablist"`, each tab `role="tab"` with `aria-selected`, left/right arrow-key navigation; renders the tab buttons only (panels controlled by parent).
- Income page: add `const [tab,setTab]=useState('months')`; render `<Tabs>` with Months/Sources/Import; show the matching panel. Move the existing **Sources** section into the Sources panel and the **CSV import** trigger into the Import panel. Leave the existing **Record form + override table** in the Months panel for now (B4 replaces the table). Keep the page green.
- [ ] **Test (Tabs.test.jsx):** renders 3 tabs; clicking a tab calls onChange; ArrowRight moves selection; active tab has `aria-selected="true"`. RED→GREEN.
- [ ] Update `Income.test.jsx` so its assertions still pass (e.g. switch to the relevant tab before asserting sources/override-log; or assert within Months panel). Keep full suite green. Run suite + build. Commit `feat: tabbed income page (Months/Sources/Import)`.

## Task B2: incomeBulk pure helpers
**Files:** Create `src/state/incomeBulk.js`, `src/state/incomeBulk.test.js`.
**Interfaces (pure; operate on a YearProfile, return a NEW `monthOverrides` object):**
- `copyMonthToRest(year, fromMonth)` — for each month after `fromMonth` in `year.taxYear`, set override `{ mainSalary, partTime }` = the **effective** values of `fromMonth` (from `materializeMonths`). Does not set `confirmed`.
- `fillProjectedFromAverage(year)` — average main and part-time totals across **confirmed** months; for each **non-confirmed** month, set override `{ mainSalary:avgMain, partTime:[{date:`${m}-15`,amount:avgPart,note:'Avg'}] }` (omit partTime entry if avg is 0). If no confirmed months, return overrides unchanged.
- `applyMainToAll(year, amount)` — set `mainSalary:amount` on every month's override (preserve any existing partTime/confirmed on that month).
- [ ] **Tests:** copyMonthToRest copies Mar→Apr..Dec; fillProjectedFromAverage uses only confirmed months and skips them; applyMainToAll sets all 12. Use `materializeMonths` for effective values. RED→GREEN.
- [ ] Pure module, no React/DOM imports. Run suite + build. Commit `feat: income bulk-action pure helpers`.

## Task B3: MonthCard component
**Files:** Create `src/components/MonthCard.jsx`, `src/components/MonthCard.test.jsx`; Modify `src/styles/app.css`.
**Interfaces:** `<MonthCard monthKey projected override pcb onChange onRecord onClear isCurrent />` where `onChange(patch)` writes the month's main/part/pcb, `onRecord()` sets confirmed, `onClear()` removes the month. Inline number inputs (main, part-time total, PCB) that call `onChange` on change; an "itemize" toggle for individual payments; status badge (Actual gold / Projected muted); "This month" marker when `isCurrent`; Record/Clear buttons. Neo-Lux card styling; actual cards get a gold accent.
- [ ] **Test:** renders status badge from `override.confirmed`; editing the main input calls `onChange` with the new value; Record button calls `onRecord`; Clear calls `onClear`; aria-labels include the month. RED→GREEN.
- [ ] Run suite + build. Commit `feat: editable MonthCard component`.

## Task B4: Months tab assembly (summary + chart + featured + grid + bulk), replace table
**Files:** Modify `src/pages/Income.jsx`, `src/styles/app.css`; Create `src/components/MonthsSummary.jsx` (summary bar + mini chart); update `src/pages/Income.test.jsx`.
**Interfaces:** `MonthsSummary` consumes `useProfile()` → shows annual gross, Actual N/12 · Projected, est. tax (`result`), and a compact Recharts 12-month stacked bar (gold main / pink part). Income Months panel renders: `<MonthsSummary/>` (sticky), the **featured current-month** `MonthCard` (larger, when `activeYear===current year`), then a `.grid-auto-wide` of the 12 `MonthCard`s. A **Bulk actions** panel wires the three `incomeBulk` helpers via `setYear` with a confirm step. **Remove the old override `<table>`** and its per-row override inputs (superseded by MonthCards); keep the Record form OR fold its behavior into the featured card (featured card covers recording — remove the standalone RecordIncomeForm from the Months panel if redundant, but keep `RecordIncomeForm.jsx`/its tests intact for reuse, or delete only if fully superseded and its test removed).
- All MonthCard edits write via `setYear` (active-year vault). Summary + chart update live.
- [ ] **Tests (Income.test.jsx):** Months panel shows 12 MonthCards; editing a card updates the summary annual gross; a bulk action (e.g. applyMainToAll) updates all months; status counts reflect actuals. Replace the obsolete override-table assertions. Keep full suite green.
- [ ] Run suite + build. Confirm no stale tokens (`grep`). Commit `feat: interactive card-based Months tab with live summary, chart and bulk actions`.

---

## Task B5: Final responsive QA + README note
**Files:** Modify `README.md`.
- [ ] Run full suite + build (green). Document a manual responsive checklist (xs/sm/md/lg/xl per page) and the new Income interactions in README. Commit `docs: responsive layout + interactive income notes`.

---

## Self-Review Notes
- Spec coverage: A1 foundation; A2–A5 per-page width; B1 tabs; B2 bulk; B3 MonthCard; B4 Months assembly (summary+chart+featured+grid+bulk, table removed); B5 QA. All spec sections mapped.
- Engine/data untouched; all writes via encrypted vault.
- Sequential ordering required (shared app.css); each task keeps the suite green.
