/**
 * Onboarding.jsx — Task 2.3
 *
 * Multi-step wizard shown when settings.onboarded === false (vault status 'empty').
 *
 * Steps:
 *   1. Welcome
 *   2. Set passcode (min 6, confirm, strength hint, backup warning)
 *   3. Choose data: use-sample-data / start-blank / import-v1 (if localStorage['tax-profile-2026'] exists)
 *
 * On finish: createVault(passcode, chosenAppData) with settings.onboarded = true.
 */

import { useState } from 'react'
import { useVault } from '../security/useVault.jsx'
import { blankAppData, migrateV1 } from '../state/appData.js'
import { defaultProfile } from '../data/defaultProfile.js'
import Button from '../components/Button.jsx'

// ── Passcode strength hint ────────────────────────────────────────────────────

function passStrength(pass) {
  if (pass.length === 0) return null
  if (pass.length < 6) return { level: 'weak', label: 'Too short (min 6 characters)' }
  if (pass.length < 8) return { level: 'fair', label: 'Fair — consider a longer passcode' }
  const hasMix = /[A-Z]/.test(pass) && /[0-9]/.test(pass)
  if (pass.length >= 10 && hasMix) return { level: 'strong', label: 'Strong' }
  if (pass.length >= 8) return { level: 'good', label: 'Good' }
  return { level: 'fair', label: 'Fair' }
}

// ── Step components ───────────────────────────────────────────────────────────

function StepWelcome({ onNext }) {
  return (
    <div className="ob-step">
      <div className="ob-icon" aria-hidden="true">🔐</div>
      <h1 className="ob-title">Welcome to Tax Tracker</h1>
      <p className="ob-desc">
        Your personal Malaysian tax calculator — fully private, fully encrypted.
        All your data is locked with a passcode you set. Only you can unlock it.
      </p>
      <ul className="ob-feature-list">
        <li>AES-256 encryption — data stored locally, never sent anywhere</li>
        <li>Multi-year tax tracking</li>
        <li>Income source projection + monthly overrides</li>
        <li>Auto-lock after idle</li>
      </ul>
      <Button variant="gold" className="ob-cta" onClick={onNext}>
        Get Started
      </Button>
    </div>
  )
}

function StepPasscode({ onNext }) {
  const [passcode, setPasscode] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')

  const strength = passStrength(passcode)

  function handleNext() {
    if (passcode.length < 6) {
      setError('Passcode must be at least 6 characters.')
      return
    }
    if (passcode !== confirm) {
      setError('Passcodes do not match. Please re-enter.')
      return
    }
    setError('')
    onNext(passcode)
  }

  return (
    <div className="ob-step">
      <div className="ob-icon" aria-hidden="true">🛡️</div>
      <h2 className="ob-title">Set your passcode</h2>
      <p className="ob-desc">
        Choose a passcode to encrypt your data. Min 6 characters.
      </p>

      <div className="ob-field">
        <label htmlFor="ob-passcode" className="ob-label">Passcode</label>
        <input
          id="ob-passcode"
          type="password"
          aria-label="Passcode"
          className="ob-input"
          value={passcode}
          onChange={e => { setPasscode(e.target.value); setError('') }}
          autoComplete="new-password"
          placeholder="Min 6 characters"
          autoFocus
        />
        {strength && (
          <span className={`ob-strength ob-strength-${strength.level}`}>
            {strength.label}
          </span>
        )}
      </div>

      <div className="ob-field">
        <label htmlFor="ob-confirm" className="ob-label">Confirm Passcode</label>
        <input
          id="ob-confirm"
          type="password"
          aria-label="Confirm Passcode"
          className="ob-input"
          value={confirm}
          onChange={e => { setConfirm(e.target.value); setError('') }}
          autoComplete="new-password"
          placeholder="Repeat passcode"
        />
      </div>

      {error && (
        <p className="ob-error" role="alert">{error}</p>
      )}

      <div className="ob-warning">
        ⚠️ <strong>There is no passcode recovery.</strong> If you forget your passcode, all data will be lost.
        Keep an <strong>unencrypted JSON backup</strong> in Settings (this backup is <em>NOT encrypted</em>).
      </div>

      <Button variant="gold" className="ob-cta" onClick={handleNext}>
        Next
      </Button>
    </div>
  )
}

function StepDataChoice({ passcode, onFinish }) {
  const { createVault } = useVault()
  const [busy, setBusy] = useState(false)

  // Check if v1 data exists in localStorage
  const v1Raw = localStorage.getItem('tax-profile-2026')
  const hasV1 = Boolean(v1Raw)

  async function finish(appData) {
    if (busy) return
    setBusy(true)
    const finalData = {
      ...appData,
      settings: { ...appData.settings, onboarded: true },
    }
    await createVault(passcode, finalData)
    setBusy(false)
  }

  async function handleBlank() {
    await finish(blankAppData(2026))
  }

  async function handleSample() {
    const yearProfile = migrateV1(defaultProfile)
    const appData = blankAppData(2026)
    appData.years[2026] = yearProfile
    await finish(appData)
  }

  async function handleImportV1() {
    try {
      const parsed = JSON.parse(v1Raw)
      const yearProfile = migrateV1(parsed)
      const appData = blankAppData(2026)
      appData.years[2026] = yearProfile
      await finish(appData)
    } catch {
      await finish(blankAppData(2026))
    }
  }

  return (
    <div className="ob-step">
      <div className="ob-icon" aria-hidden="true">📂</div>
      <h2 className="ob-title">Choose your starting data</h2>
      <p className="ob-desc">
        How do you want to start? You can always add or edit data later.
      </p>

      <div className="ob-choices">
        <button
          type="button"
          className="ob-choice-card"
          onClick={handleSample}
          disabled={busy}
        >
          <span className="ob-choice-icon">📊</span>
          <span className="ob-choice-title">Use Sample Data</span>
          <span className="ob-choice-desc">
            Load a pre-filled example profile (based on default 2026 figures) — great for exploring the app.
          </span>
        </button>

        <button
          type="button"
          className="ob-choice-card"
          onClick={handleBlank}
          disabled={busy}
        >
          <span className="ob-choice-icon">✨</span>
          <span className="ob-choice-title">Start Blank</span>
          <span className="ob-choice-desc">
            Begin with an empty profile — add your own income sources and reliefs.
          </span>
        </button>

        {hasV1 && (
          <button
            type="button"
            className="ob-choice-card ob-choice-import"
            onClick={handleImportV1}
            disabled={busy}
          >
            <span className="ob-choice-icon">📥</span>
            <span className="ob-choice-title">Import Existing Data</span>
            <span className="ob-choice-desc">
              Found your previous Tax Tracker data. Import and encrypt it now.
            </span>
          </button>
        )}
      </div>

      {busy && <p className="ob-busy">Setting up your vault…</p>}
    </div>
  )
}

// ── Wizard shell ──────────────────────────────────────────────────────────────

const STEPS = ['welcome', 'passcode', 'choice']

export default function Onboarding() {
  const [stepIdx, setStepIdx] = useState(0)
  const [passcode, setPasscode] = useState('')

  function handleWelcomeNext() {
    setStepIdx(1)
  }

  function handlePasscodeNext(chosenPasscode) {
    setPasscode(chosenPasscode)
    setStepIdx(2)
  }

  const step = STEPS[stepIdx]

  return (
    <div className="ob-backdrop">
      <div className="ob-panel">
        {/* Step indicator */}
        <div className="ob-steps-indicator" aria-label="Onboarding progress">
          {STEPS.map((s, i) => (
            <span
              key={s}
              className={`ob-step-dot ${i === stepIdx ? 'ob-step-dot--active' : ''} ${i < stepIdx ? 'ob-step-dot--done' : ''}`}
              aria-current={i === stepIdx ? 'step' : undefined}
            />
          ))}
        </div>

        {step === 'welcome' && <StepWelcome onNext={handleWelcomeNext} />}
        {step === 'passcode' && <StepPasscode onNext={handlePasscodeNext} />}
        {step === 'choice' && <StepDataChoice passcode={passcode} />}
      </div>
    </div>
  )
}
