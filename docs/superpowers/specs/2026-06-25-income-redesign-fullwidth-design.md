# Income Redesign + Full-Width Responsive Layout — Design Spec

**Date:** 2026-06-25
**Author:** Brainstormed with Ieskandar
**Status:** Approved design → ready for plan + workflow
**Builds on:** Tax Tracker v2 (Neo-Lux, income sources, `monthOverrides` + `confirmed`)

---

## Goals

1. **Every page fills the screen and adapts to any size** (the current `.container` caps at 1100px and centers, leaving dead space on wide screens). Fill up to a **comfortable ~1560px bound**; reflow cleanly down to 320px.
2. **Income page becomes interactive, card-based and dynamic**: segmented tabs, a featured current-month card, a grid of editable month cards (replacing the table), inline editing, quick bulk actions, and a live summary + mini chart.

Tax **engine and data model are unchanged** (still `monthOverrides[month] = {mainSalary?, partTime?, confirmed?}`, `pcbPaid[]`). This is presentation + interaction.

---

## Part A — Full-width responsive layout (all pages)

### A1. Layout foundation (`app.css`)
- `.container` → fluid: `width:100%; max-width:1560px; margin:0 auto; padding:24px clamp(16px,4vw,48px);`
- Add reusable auto-fill grid utilities:
  - `.grid-auto` → `display:grid; gap:16px; grid-template-columns:repeat(auto-fit, minmax(220px,1fr));`
  - `.grid-auto-wide` → `minmax(320px,1fr)`.
- `.topbar` padding aligned to the same fluid side padding.
- These collapse naturally (auto-fit) — fewer explicit breakpoints needed.

### A2–A6. Per-page width usage (behavior unchanged, layout reworked)
- **Dashboard:** hero full-width; stat cards use `.grid-auto` (4-up wide → 2-up tablet → 1-up phone); the monthly-income **chart and the Set-Aside card sit side-by-side** on wide (`grid-template-columns: 2fr 1fr`), stacked below `lg`.
- **Reliefs:** relief cards in `.grid-auto-wide` (2–3 across on wide) instead of one tall stack; the totals bar spans full width.
- **Tax Calc:** on wide screens the bracket-breakdown card sits left and the three scenario cards stack in a column on the right (`grid-template-columns: 1.3fr 1fr`); below `lg` they stack vertically (breakdown, then scenarios as their own auto-fill row).
- **Settings:** sections in a 2-column grid on wide (`.grid-auto-wide`), 1-col on narrow.
- **BE Guide:** **keeps a readable measure** — content max-width ~`72ch` for prose, but uses a 2-column grid for the field-mapping table vs. the checklist on wide screens. (Deliberately not full-bleed: long text lines hurt readability.)
- **Responsive audit:** every page verified at xs(320)/sm(480)/md(768)/lg(1024)/xl(1440+) — no horizontal overflow, sensible column counts.

---

## Part B — Income page: interactive & card-based

### B1. Tabs shell (`Income.jsx` + `Tabs` component)
- Segmented control: **Months · Sources · Import** (accessible: `role="tablist"`, arrow-key nav, `aria-selected`). Active tab persisted in component state (default Months).
- **Sources tab:** existing `SourceCard` grid (add/remove/edit) + projected annual gross note.
- **Import tab:** the existing Bank CSV import (modal content, or inline panel).

### B2. MonthCard component (`MonthCard.jsx`)
- One card per month. Shows: month label, **status badge** (Actual gold / Projected muted), main salary, part-time total, **month total**, and PCB.
- **Inline-editable**: number inputs for main, part-time (Total mode, with an "itemize" affordance for individual payments), and PCB. Edits **auto-save** (on change/blur) through `useProfile().setYear` over `monthOverrides`/`pcbPaid`.
- **Record as actual** button → sets `confirmed:true`. **Clear** → removes the month override + its PCB entry (revert to projected).
- Actual cards visually distinct (gold accent border / badge); current month gets a "This month" marker.

### B3. Months tab assembly
- **Sticky live summary bar** (top of Months tab): annual gross, **Actual N/12 · Projected (12−N)**, estimated tax (from `result`), refreshing instantly as cards are edited. Includes a **compact 12-month stacked bar mini-chart** (Recharts, Neo-Lux colors).
- **Featured "This month" card** (when `activeYear === current year`) rendered prominently first (larger), letting the user fill the current month immediately.
- **Responsive grid of the 12 MonthCards** (`.grid-auto-wide`, multiple per row on wide, 1 on phone). The current month sorts/marks first.

### B4. Quick bulk actions (`incomeBulk.js`, pure helpers + UI)
Pure functions over a `YearProfile`, each returning a new `monthOverrides` map (not marking `confirmed` unless stated):
- `copyMonthToRest(year, fromMonth)` — apply `fromMonth`'s effective main + part-time to every later month in the year.
- `fillProjectedFromAverage(year)` — average the **actual** (confirmed) months' main + part-time, write it as an override for each non-confirmed month.
- `applyMainToAll(year, amount)` — set every month's `mainSalary` override to `amount`.
A small "Bulk actions" panel exposes these with a confirm step; each writes via `setYear`.

---

## Data & engine
- No engine change. No new persisted fields beyond the existing `confirmed`. All writes go through the encrypted active-year vault (`setYear → vault.save`); no plaintext leak.
- `materializeMonths` unchanged.

---

## Testing
- **Pure:** `incomeBulk.js` helpers (copy/fill-average/apply-all produce correct `monthOverrides`).
- **Components:** MonthCard inline edit auto-saves + record/clear toggles `confirmed`; Tabs switch panels and are keyboard-navigable; Months tab renders 12 cards + featured current-month; summary count reflects actuals.
- **Regression:** existing income/dashboard/reliefs/taxcalc/settings tests stay green (selectors updated only where markup changed); full suite + `npm run build` green; no stale `--primary/--warn/--text/--bg` tokens; PWA intact.
- Layout is CSS — verified via build + manual responsive check (documented checklist), not unit tests.

---

## Build phasing (for the workflow)
1. **Phase A (layout):** A1 foundation → Dashboard → Reliefs/TaxCalc/Settings → BE Guide. Sequential (shared `app.css`).
2. **Phase B (income):** Tabs shell + Sources/Import tabs → MonthCard + bulk pure helpers → Months tab assembly (summary + chart + featured + grid + bulk UI), replacing the old override table.

---

## Out of scope (YAGNI)
- No drag-to-reorder months/sources.
- No new tax math, brackets, or persisted schema changes.
- No animations beyond lightweight CSS transitions already in the system.
