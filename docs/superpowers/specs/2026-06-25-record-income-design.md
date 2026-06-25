# Record Income (flexible monthly submission) — Design Spec

**Date:** 2026-06-25
**Author:** Brainstormed with Ieskandar
**Status:** Approved design → ready for plan
**Builds on:** Tax Tracker v2 (`income sources` + `monthOverrides` model)

---

## Goal

Let the user **submit income for any month** — current, future, or past — in a fast, deliberate way, and distinguish **actual** (confirmed/recorded) months from **projected** (estimated from sources) ones.

Today is treated as the runtime date (e.g. June 2026). Months Jan–Jun can be submitted as actuals as they happen; Jul–Dec stay projected until recorded.

---

## Concept: actual vs projected

- A month with **no override** is **projected** from the income sources.
- When the user **records** a month, its override is written with `confirmed: true` → the month is **actual**.
- The pure tax **engine is unchanged**: it already sums whatever `materializeMonths` produces. `confirmed` is metadata read only by the UI (table badge + dashboard count).

---

## 1. "Record income" form (top of the Income page)

`RecordIncomeForm.jsx`, consuming `useProfile()` (`year`, `setYear`, `taxYear`).

Fields:
- **Month** — `<select>` of the active year's 12 months (`YYYY-MM`). Defaults to the **current month** when `activeYear === current calendar year`, otherwise month 1. Any past/future month selectable.
- **Main salary (RM)** — number; pre-filled with the month's current value (its recorded figure if actual, else the projected amount as a placeholder).
- **Part-time** — a mode toggle:
  - **Total** (default): one "Part-time total (RM)" field → stored as a single entry `[{ date: 'YYYY-MM-15', amount, note: 'Monthly total' }]` (omitted if 0).
  - **Itemized**: add/remove dated rows (date + amount) → stored as the entered array.
  - When loading an existing month: itemized mode if it has >1 entry or non-15th dates, else total mode.
- **PCB / MTD deducted (RM)** — number; the tax already deducted that month. Pre-filled from the month's `pcbPaid` entry.

Actions:
- **Save / Record** → in one `setYear` write:
  - `monthOverrides[month] = { mainSalary, partTime, confirmed: true }`
  - upsert `pcbPaid` for that month: replace the entry with matching `month`, or append `{ month, amount, ref: 'Recorded' }` (omit/zero-amount removes it).
  - Shows a subtle "Recorded ✓".
- **Clear this month (revert to projected)** → delete `monthOverrides[month]` and the month's `pcbPaid` entry.

---

## 2. Improved Month table (existing override log)

- New **Status** column: gold **Actual** badge when `monthOverrides[month]?.confirmed`, muted **Projected** otherwise.
- **Current-month row highlighted** with a "This month" marker (only when `activeYear === current year`).
- Keep the existing per-field overrides (main + part-time). Editing a field in the table still works but does **not** mark the month actual — recording as actual is done **only** through the Record form (the explicit "this is real" action). Keep the existing ✕ clear-month (which also clears the `confirmed` flag and that month's PCB entry).

---

## 3. Dashboard indicator

A small line/card on the Dashboard: **"N of 12 months actual · (12−N) projected"**, where N = count of `monthOverrides` with `confirmed === true` for the active year. Communicates how firm the estimate is.

---

## 4. Data model

```
YearProfile.monthOverrides['YYYY-MM'] = {
  mainSalary?: number,
  partTime?: Array<{date, amount, note}>,
  confirmed?: boolean      // NEW — true when recorded as actual
}
YearProfile.pcbPaid: Array<{ month:'YYYY-MM', amount:number, ref:string }>   // upserted by month
```

- `materializeMonths` unchanged (ignores `confirmed`).
- `computeTax` unchanged.
- All writes go through the encrypted active-year vault (`setYear` → `vault.save` → re-encrypt). No plaintext leak.

---

## 5. Testing

- Record a month (main + part total + PCB) → `monthOverrides[m].confirmed === true`, month total reflects it, `pcbPaid` updated, `result` recomputes.
- Itemized part-time → stored as the entered array; total recomputed.
- Clear month → override + pcb entry removed, reverts to projected.
- Default month = current month within active year.
- Dashboard shows the correct actual/projected count.
- Status badge renders Actual/Projected correctly; full suite + build stay green; no stale tokens.

---

## 6. Out of scope (YAGNI)

- No reminders/notifications to submit each month.
- No bulk multi-month submit (one month per form save; the table covers bulk editing).
- No change to tax brackets / engine math.
