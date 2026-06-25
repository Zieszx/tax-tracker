# Tax Tracker 2026

A private, **browser-only Malaysian personal income-tax tracker & calculator** — v2 with passcode lock, AES-GCM encryption, and a "Neo-Lux" visual redesign. Track your income sources, estimate the tax you owe, optimise reliefs, and prepare for Borang BE e-filing — all without a backend. Your data never leaves your browser.

**Live app:** https://zieszx.github.io/tax-tracker/

> ⚠️ Estimates for personal planning only — **not official tax advice**. Verify figures against the official LHDN schedule and [mytax.hasil.gov.my](https://mytax.hasil.gov.my), and consult a licensed tax agent (ejen cukai).

---

## v2 Features

- **Passcode lock + AES-GCM encryption** — all data encrypted at rest in `localStorage` via Web Crypto API (PBKDF2 + AES-GCM 256-bit). The app is always locked on load; unlock with your passcode. Plaintext exists only in memory while unlocked.
- **Neo-Lux visual theme** — Neobrutalism + Claymorphism + Royal Noir palette (gold/ink/pink/emerald), with auto dark mode that follows device preference. Fully responsive from 320px to large desktop.
- **Income sources model** — define jobs once (main employment + part-time gigs), project them across the year, and override individual months. Sources shown side-by-side on desktop.
- **Multi-year support** — add, switch, and compare assessment years. Each year stores its own income, reliefs, PCB, and savings data.
- **PWA / installable + offline** — install to home screen on Android/iOS/desktop via `vite-plugin-pwa`. Works offline after first load.
- **Bank CSV import** — import bank statement CSV (Bank Islam-style format) to automatically populate part-time income entries via a review modal with checkboxes.
- **Set-aside savings tracker** — track how much you have set aside towards your projected tax balance, with a progress bar and suggested monthly target.
- **PDF export** — print a clean, identity-free one-page tax summary (gross, reliefs, chargeable, tax, PCB, balance) via the browser's print dialog.
- **Expanded Borang BE guide** — step-by-step e-filing walkthrough with live figures from your data, Bahagian mapping, FPX/JomPAY payment, the "Umiii" non-taxable note, deadlines, penalties, and a before-you-file checklist.
- **Settings** — theme selector, auto-lock timer, change passcode, export/import JSON backup, reset app.
- **Auto-lock** — locks automatically after a configurable period of inactivity.

---

## Important limitation — passcode recovery

> **⚠️ If you forget your passcode, your data cannot be recovered.** The encryption key is derived exclusively from your passcode — there is no "forgot passcode" flow. The only option is to reset the app (which permanently deletes all encrypted data) and start over. Keep your passcode safe.

---

## Manual smoke checklist

Use this checklist to verify the app works correctly after a deploy or major change:

- [ ] Open the app — should show the Onboarding wizard (first run) or the Lock screen (returning user)
- [ ] Complete onboarding: set a passcode (≥6 chars), choose "use sample data"
- [ ] Verify Dashboard shows income stats, balance/refund figure, and monthly chart
- [ ] Lock the app (tap Lock button in the top bar) — should return to lock screen
- [ ] Unlock with the correct passcode — data should reappear
- [ ] Enter a wrong passcode — should show "Incorrect passcode." and stay locked
- [ ] Navigate to Income: verify two source cards (Main employer + Nuvera); edit a salary field and confirm projected gross updates
- [ ] Add a new part-time source, confirm it appears as a third card; remove it
- [ ] Navigate to Reliefs: adjust a relief slider, confirm TaxCalc result updates
- [ ] Navigate to TaxCalc: verify bracket breakdown and scenario comparison
- [ ] Switch year: tap the year switcher, add a new year (blank), confirm it switches and data is empty
- [ ] Switch back to 2026 and confirm figures are restored
- [ ] Navigate to Settings: change auto-lock to 1 minute; change passcode (requires old passcode); re-lock and unlock with the new passcode
- [ ] Export JSON backup from Settings; import it back; confirm data unchanged
- [ ] Open Borang BE Guide: verify live figures appear (not "—") and all sections are present
- [ ] Export PDF: click "Export PDF" button, verify browser print dialog opens with the summary
- [ ] Install PWA: in a Chromium browser, confirm the "Install" prompt appears; install and launch from home screen
- [ ] Go offline (DevTools → Network → Offline) and reload — app should still load
- [ ] CSV import: on the Income page, tap "Import CSV", upload a bank statement, verify credit rows appear in the review table, confirm selection adds them as part-time entries
- [ ] Reset app from Settings: type "RESET" to confirm — verify all data is cleared and Onboarding is shown again

---

## Tech stack

Vite · React 18 (JSX) · React Router (HashRouter) · Recharts · Vitest + Testing Library · vite-plugin-pwa · Web Crypto API. The tax engine (`src/engine/`) is pure, framework-free, and unit-tested.

## Local development

```bash
npm install
npm run dev       # local dev server
npm test          # run the test suite (Vitest) — 120+ tests
npm run build     # production static bundle in dist/ (includes sw.js + manifest.webmanifest)
npm run preview   # preview the production build locally
```

## Deployment

Pushing to the `main` branch automatically builds and deploys to GitHub Pages via the workflow in [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

**One-time setup:** in the GitHub repo, go to **Settings → Pages → Build and deployment → Source** and select **GitHub Actions**.

The app uses a relative base (`'./'`) and `HashRouter`, so it works correctly when served from a project subpath (`/tax-tracker/`) without any 404 / refresh issues.

## Project structure

```
src/
  engine/      pure tax logic (constants, deductions, tax, format) — unit tested
  security/    crypto.js (AES-GCM/PBKDF2), useVault.jsx (encrypted in-memory store)
  state/       appData.js (v2 schema, defaults, v1 migration), materialize.js (month projection)
  data/        defaultProfile.js (seed), csvImport.js (bank CSV parser)
  hooks/       useLocalStorage.js, useProfile.js (active-year vault adapter)
  components/  Nav, Button, Card, StatCard, ProgressBar, ThemeToggle, LockButton,
               SourceCard, YearSwitcher, SavingsCard, ImportCsvModal, PrintSummary, Footer
  pages/       Lock, Onboarding, Dashboard, Income, Reliefs, TaxCalc, BorangGuide, Settings
  styles/      theme.css (Neo-Lux tokens), app.css, print.css
public/
  pwa-192.png  solid-gold PWA icon (192×192)
  pwa-512.png  solid-gold PWA icon (512×512)
```

## Customising the tax rules

Tax brackets and statutory rates (EPF, SOCSO, EIS) live in [`src/engine/constants.js`](src/engine/constants.js) — update them for future assessment years. Brackets can also be overridden per-year via `settings.taxBrackets` in the vault.
