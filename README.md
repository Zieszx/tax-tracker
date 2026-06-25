# Tax Tracker 2026 🧮

A private, **browser-only Malaysian personal income-tax tracker & calculator**, built with Vite + React. Track your monthly income, estimate the tax you'll owe (or get refunded), optimise your reliefs, and prepare for Borang BE e-filing — all without a backend. Your data never leaves your browser.

**Live app:** https://zieszx.github.io/tax-tracker/

> ⚠️ Estimates for personal planning only — **not official tax advice**. Verify figures against the official LHDN schedule and [mytax.hasil.gov.my](https://mytax.hasil.gov.my), and consult a licensed tax agent (ejen cukai).

---

## Features

- **📊 Dashboard** — estimated balance due / refund, income breakdown, PCB-paid progress, effective tax rate, and a monthly income chart.
- **💰 Income Log** — track main salary and part-time payments month by month (captures the 1st/15th DuitNow pattern), with running totals.
- **🎯 Reliefs** — manage tax reliefs against their statutory limits, with live "what-if" suggestions ("top up SSPN → save ~RMxxx").
- **🧮 Tax Calculator** — fully transparent, bracket-by-bracket breakdown (no black box) plus side-by-side scenario comparison (main-only vs with part-time vs reliefs maxed).
- **📋 Borang BE Guide** — step-by-step e-filing walkthrough mapping your figures to the actual BE form fields, with deadline and payment info.
- **🌗 Light / dark mode**, fully responsive (sidebar on desktop, bottom nav on mobile), keyboard accessible.
- **💾 Private by design** — everything is stored in `localStorage`. Export/import your data as JSON for backup or to move between devices. Reset to the bundled 2026 profile or clear to a blank calculator at any time.

The app ships pre-loaded with a 2026 profile as an editable default, so it doubles as a generic calculator for any Malaysian resident.

---

## Tech stack

Vite · React 18 (JSX) · React Router (HashRouter) · Recharts · Vitest + Testing Library. The tax engine (`src/engine/`) is pure, framework-free, and unit-tested — correctness is the priority.

## Local development

```bash
npm install
npm run dev       # local dev server
npm test          # run the test suite (Vitest)
npm run build     # production static bundle in dist/
npm run preview   # preview the production build locally
```

## Deployment

Pushing to the `main` branch automatically builds and deploys to GitHub Pages via the workflow in [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

**One-time setup:** in the GitHub repo, go to **Settings → Pages → Build and deployment → Source** and select **GitHub Actions**.

The app uses a relative base and `HashRouter`, so it works correctly when served from a project subpath (`/tax-tracker/`) without any 404 / refresh issues.

## Customising the tax rules

Tax brackets and statutory rates (EPF, SOCSO, EIS) live in [`src/engine/constants.js`](src/engine/constants.js) and are treated as the assumed YA2026 schedule — update them there for future assessment years. Brackets can also be overridden per-profile via `settings.taxBrackets`.

## Project structure

```
src/
  engine/      pure tax logic (constants, deductions, tax, format) — unit tested
  data/        default + blank seed profiles
  hooks/       useLocalStorage, useProfile (context + memoized tax result)
  components/   Nav, Card, StatCard, ProgressBar, ThemeToggle, Footer
  pages/       Dashboard, IncomeLog, Reliefs, TaxCalc, BorangGuide
```
