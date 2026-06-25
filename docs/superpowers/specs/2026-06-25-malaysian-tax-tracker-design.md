# Malaysian Tax Tracker 2026 — Design Spec

**Date:** 2026-06-25
**Author:** Brainstormed with Ieskandar Zulqarnain
**Status:** Approved design → ready for implementation plan

---

## 1. Purpose

A personal-but-generic **Malaysian personal income tax tracker & calculator** web app.

- Pre-loaded with Ieskandar's 2026 figures as an **editable default profile**.
- Also usable as a **blank generic calculator** for any Malaysian resident (reset/clear option).
- Helps **track** income monthly, **calculate** estimated tax owed/refund, **optimize** reliefs, and **prepare** for Borang BE e-filing.

Gives **estimates for planning only** — a subtle footer note states it is not official tax advice.

---

## 2. Tech & Architecture

- **Vite + React (JSX)** — single-page app.
- **No backend.** Static-site deployable (Netlify / Vercel / GitHub Pages).
- **localStorage** persistence via a `useLocalStorage` hook, plus **JSON export/import** for backup/portability.
- Styling: **CSS variables + light/dark theme** (no heavy CSS framework). Charts via **Recharts**.
- Ships with Ieskandar's 2026 profile as default seed data; "Reset to my data" and "Clear to blank" actions.

### Design system (the agreed "mix")
- **Base:** Clean Fintech — light, airy, trustworthy. Sky-blue primary.
- **Dark mode toggle:** Dark Pro — indigo + emerald accents.
- **Warm touches:** rounded cards, friendly/encouraging microcopy, amber progress accents.
- Accent palette working in both themes: **sky-blue (primary) · emerald (positive/refund) · amber (progress/warnings)**.
- Smooth motion, fully responsive, accessible (keyboard nav, ARIA, WCAG AA contrast).

### Navigation (responsive mix)
- **Desktop:** left sidebar (icons + labels), collapsible to a slim icon rail.
- **Mobile:** transforms into an app-like bottom nav bar (thumb-friendly).
- Dark-mode aware, smooth transition between modes.

---

## 3. Data Model (localStorage)

```
TaxProfile {
  settings: {
    taxYear: 2026,
    residentStatus: "resident",
    maritalStatus: "single",
    theme: "light" | "dark" | "system"
  },
  income: {
    months: [
      {
        month: "2026-01",
        mainSalary: 3100.00,        // gross
        partTime: [                 // individual DuitNow entries
          { date: "2026-01-01", amount: 333.33, note: "" }
        ]
      },
      ...
    ]
  },
  pcbPaid: [
    { month: "2026-02", amount: 79.35, ref: "20-EM2600402490" },
    ...
  ],
  reliefs: [
    { key: "personal", label: "Personal relief", amount: 9000, limit: 9000, auto: true },
    { key: "life_insurance", label: "Life insurance", amount: 360, limit: 3000 },
    { key: "lifestyle", label: "Lifestyle (WiFi/phone/etc.)", amount: 2500, limit: 2500 },
    { key: "socso", label: "SOCSO/EIS contribution", amount: 237, limit: 350 },
    { key: "sspn", label: "SSPN net deposit", amount: 0, limit: 8000 },
    { key: "medical", label: "Medical checkup", amount: 0, limit: 1000 },
    ...
  ]
}
```

### Statutory deductions (auto-computed from gross, per month, configurable constants)
- **EPF:** 11% of gross (employee share).
- **SOCSO:** 0.5% of gross, capped at RM19.75/month (salary > RM4,000 band).
- **EIS:** 0.2% of gross, capped at salary RM4,000 (→ max RM7.90/month).

Note: part-time (Nuvera) income has **no EPF/SOCSO/EIS** — treated as informal/freelance employment income, still taxable.

---

## 4. Tax Engine (core — fully transparent, unit-tested)

Stored as **editable config** so rates update for future years.

### Resident progressive brackets (YA2026 baseline — editable)
| Chargeable income (RM) | Rate |
|---|---|
| 0 – 5,000 | 0% |
| 5,001 – 20,000 | 1% |
| 20,001 – 35,000 | 3% |
| 35,001 – 50,000 | 6% |
| 50,001 – 70,000 | 11% |
| 70,001 – 100,000 | 19% |
| 100,001 – 400,000 | 25% |
| 400,001 – 600,000 | 26% |
| 600,001 – 2,000,000 | 28% |
| above 2,000,000 | 30% |

> Rates are stored in a `taxBrackets` config array and surfaced in Settings so they can be corrected against the official LHDN schedule for the assessment year. The app clearly labels them as the assumed schedule.

### Calculation pipeline
1. **Total gross** = Σ(main salary) + Σ(part-time).
2. **Chargeable income** = total gross − total reliefs (EPF contribution counts toward the life-insurance+EPF relief grouping per LHDN rules; modeled in the reliefs config).
3. **Gross tax** = sum across brackets (bracket-by-bracket breakdown shown, no black box).
4. **Balance** = gross tax − PCB already paid → **amount due** (positive) or **refund** (negative).
5. **Effective tax rate** = gross tax ÷ total gross.

All intermediate numbers are displayed.

---

## 5. Pages

1. **Dashboard**
   - Hero card: estimated **balance due / refund** with friendly framing.
   - Income breakdown (main vs part-time), PCB-paid progress, effective rate.
   - YTD charts (monthly income, cumulative tax accrual).
   - Encouraging nudges ("62% of the year tracked — keep it up!").

2. **Income Log**
   - Monthly table: main salary + part-time entries (date, amount, note).
   - Add/edit/delete entries; auto running totals and projected full-year.
   - Captures 1st/15th DuitNow pattern and exclusions (e.g. RM300 "Umiii" personal transfer marked non-income).

3. **Reliefs**
   - Manage reliefs with **limit progress bars**.
   - Optimization suggestions ("Add SSPN RM8,000 → save ~RM880", "Top up lifestyle to RM2,500 max").

4. **Tax Calc**
   - Full transparent bracket-by-bracket breakdown + effective rate.
   - **What-if sliders** (reliefs/income) with live recalculation.
   - **Side-by-side scenario comparison** (e.g. "main only" vs "with part-time" vs "with extra reliefs").

5. **Borang BE Guide**
   - Step-by-step e-filing walkthrough mapping the user's figures to actual BE form fields (Bahagian B employment income incl. part-time, reliefs section).
   - Deadline reminder (30 April 2027), portal (mytax.hasil.gov.my), payment instructions (FPX / JomPAY biller).
   - "Things to do" checklist (receipts, SSPN consideration, medical checkup, etc.).

---

## 6. Quality & Testing

- **Tax engine is unit-tested first (TDD)** — correctness is paramount; test against the file's reference figures and known 2025 BE result (RM52.43 benchmark).
- Responsive across phone/desktop; dark mode; accessible.
- Friendly, encouraging microcopy throughout.
- Subtle footer disclaimer: estimates only, not official tax advice; consult a licensed ejen cukai.

---

## 7. Out of Scope (YAGNI)

- No backend / user accounts / multi-user.
- No real LHDN/MyTax API integration (manual entry only).
- No automatic bank statement import (CSV import could be a future enhancement).
- No non-resident or business-income (Borang B) tax logic — resident BE only.
