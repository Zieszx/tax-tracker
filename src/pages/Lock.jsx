/**
 * Lock.jsx — Task 2.2
 *
 * Frosted-glass Neo-Lux lock screen.
 * Consumes useVault() → { unlock, resetApp }.
 *
 * Layout: full-viewport noir radial-gradient backdrop with a centered
 * frosted-glass card containing:
 *   - brand / title
 *   - password input (aria-label="passcode")
 *   - Unlock button (gold variant)
 *   - error message (shown after failed attempt)
 *   - "Reset app (wipes data)" link
 */

import { useState } from 'react'
import { useVault } from '../security/useVault.jsx'
import Button from '../components/Button.jsx'

export default function Lock() {
  const { unlock, resetApp } = useVault()

  const [passcode, setPasscode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    setError('')
    try {
      const ok = await unlock(passcode)
      if (!ok) {
        setError('Incorrect passcode.')
      }
    } finally {
      setBusy(false)
    }
  }

  function handleReset() {
    const confirmed = window.confirm(
      'This will permanently wipe all your data. There is no recovery. Continue?'
    )
    if (confirmed) {
      resetApp()
    }
  }

  return (
    <div className="lock-backdrop">
      <div className="lock-card" role="main">
        <div className="lock-brand">
          <span className="lock-icon">🔐</span>
          <h1 className="lock-title">Tax Tracker</h1>
          <p className="lock-subtitle">Enter your passcode to unlock</p>
        </div>

        <form onSubmit={handleSubmit} className="lock-form" noValidate>
          <div className="lock-field">
            <label htmlFor="lock-passcode" className="lock-label">
              Passcode
            </label>
            <input
              id="lock-passcode"
              type="password"
              aria-label="passcode"
              className="lock-input"
              value={passcode}
              onChange={e => setPasscode(e.target.value)}
              autoFocus
              autoComplete="current-password"
              placeholder="••••••"
              disabled={busy}
            />
          </div>

          {error && (
            <p className="lock-error" role="alert">
              {error}
            </p>
          )}

          <Button
            type="submit"
            variant="gold"
            className="lock-btn"
            disabled={busy || passcode.length === 0}
          >
            {busy ? 'Unlocking…' : 'Unlock'}
          </Button>
        </form>

        <div className="lock-reset">
          <button
            type="button"
            className="lock-reset-link"
            onClick={handleReset}
          >
            Reset app (wipes data)
          </button>
        </div>
      </div>
    </div>
  )
}
