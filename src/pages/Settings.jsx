/**
 * Settings.jsx — Task 2.6
 *
 * Sections:
 *   - Theme select (system / light / dark)  → vault.save settings.theme
 *   - Auto-lock minutes                     → vault.save settings.autoLockMinutes
 *   - Change passcode                        → vault.changePasscode
 *   - Export JSON (plain) / Import JSON      → vault.exportPlain / useProfile.importJson
 *   - Manual lock                            → vault.lock
 *   - Reset app (typed "RESET" confirm)      → vault.resetApp
 */

import { useState, useRef } from 'react'
import { useVault } from '../security/useVault.jsx'
import { useProfile } from '../hooks/useProfile.js'
import Button from '../components/Button.jsx'

// ── theme helpers ──────────────────────────────────────────────────────────

const THEME_OPTIONS = [
  { value: 'system', label: 'Follow device' },
  { value: 'light',  label: 'Light'         },
  { value: 'dark',   label: 'Dark'          },
]

// ── Settings page ──────────────────────────────────────────────────────────

export default function Settings() {
  const vault   = useVault()
  const profile = useProfile()

  const { settings, save, lock, changePasscode, resetApp, exportPlain } = vault

  // ── local state ──────────────────────────────────────────────────────────

  // Auto-lock
  const [autoLock, setAutoLock]           = useState(String(settings?.autoLockMinutes ?? 5))
  const [autoLockSaved, setAutoLockSaved] = useState(false)

  // Theme
  const [theme, setTheme]           = useState(settings?.theme ?? 'system')
  const [themeSaved, setThemeSaved] = useState(false)

  // Change passcode
  const [cpOld, setCpOld]       = useState('')
  const [cpNew, setCpNew]       = useState('')
  const [cpConfirm, setCpConfirm] = useState('')
  const [cpError, setCpError]   = useState('')
  const [cpSuccess, setCpSuccess] = useState(false)
  const [cpBusy, setCpBusy]     = useState(false)

  // Export / Import
  const [importError, setImportError]   = useState('')
  const [importSuccess, setImportSuccess] = useState(false)
  const importRef = useRef(null)

  // Reset app
  const [resetExpanded, setResetExpanded] = useState(false)
  const [resetInput, setResetInput]       = useState('')
  const [resetError, setResetError]       = useState('')

  // ── Save auto-lock ────────────────────────────────────────────────────────

  async function handleSaveAutoLock() {
    const mins = parseInt(autoLock, 10)
    if (isNaN(mins) || mins < 1) return
    await save((d) => ({
      ...d,
      settings: { ...d.settings, autoLockMinutes: mins },
    }))
    setAutoLockSaved(true)
    setTimeout(() => setAutoLockSaved(false), 2000)
  }

  // ── Save theme ────────────────────────────────────────────────────────────

  async function handleSaveTheme() {
    await save((d) => ({
      ...d,
      settings: { ...d.settings, theme },
    }))
    setThemeSaved(true)
    setTimeout(() => setThemeSaved(false), 2000)
  }

  // ── Change passcode ───────────────────────────────────────────────────────

  async function handleChangePasscode(e) {
    e.preventDefault()
    setCpError('')
    setCpSuccess(false)

    if (cpNew.length < 6) {
      setCpError('New passcode must be at least 6 characters.')
      return
    }
    if (cpNew !== cpConfirm) {
      setCpError('New passcodes do not match.')
      return
    }

    setCpBusy(true)
    try {
      const ok = await changePasscode(cpOld, cpNew)
      if (ok) {
        setCpSuccess(true)
        setCpOld('')
        setCpNew('')
        setCpConfirm('')
      } else {
        setCpError('Incorrect current passcode.')
      }
    } finally {
      setCpBusy(false)
    }
  }

  // ── Export JSON ───────────────────────────────────────────────────────────

  function handleExport() {
    const json = exportPlain()
    const blob = new Blob([json], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = 'tax-tracker-backup.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  // ── Import JSON ───────────────────────────────────────────────────────────

  function handleImportFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setImportError('')
    setImportSuccess(false)
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        profile.importJson(ev.target.result)
        setImportSuccess(true)
        setTimeout(() => setImportSuccess(false), 3000)
      } catch (err) {
        setImportError(err.message ?? 'Import failed.')
      }
    }
    reader.readAsText(file)
    // Reset input so the same file can be re-selected
    e.target.value = ''
  }

  // ── Reset app ─────────────────────────────────────────────────────────────

  function handleResetConfirm() {
    if (resetInput.trim().toUpperCase() !== 'RESET') {
      setResetError('Type RESET (in capitals) to confirm.')
      return
    }
    resetApp()
  }

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div>
      <h2 className="page-title">Settings</h2>
      <p className="subtitle">Manage your preferences and account.</p>

      {/* ── Theme ─────────────────────────────────────────────────────────── */}
      <section className="card settings-section" aria-labelledby="theme-heading">
        <h3 className="settings-heading" id="theme-heading">Theme</h3>
        <div className="settings-row">
          <label className="settings-label" htmlFor="settings-theme">
            Appearance
          </label>
          <select
            id="settings-theme"
            className="settings-select"
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
          >
            {THEME_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div className="settings-actions">
          <Button variant="gold" onClick={handleSaveTheme}>
            Save theme
          </Button>
          {themeSaved && <span className="settings-saved">Saved!</span>}
        </div>
      </section>

      {/* ── Auto-lock ─────────────────────────────────────────────────────── */}
      <section className="card settings-section" aria-labelledby="autolock-heading">
        <h3 className="settings-heading" id="autolock-heading">Auto-lock</h3>
        <div className="settings-row">
          <label className="settings-label" htmlFor="settings-autolock">
            Auto-lock after (minutes)
          </label>
          <input
            id="settings-autolock"
            type="number"
            min="1"
            max="120"
            className="settings-input"
            value={autoLock}
            onChange={(e) => setAutoLock(e.target.value)}
            aria-label="Auto-lock minutes"
          />
        </div>
        <div className="settings-actions">
          <Button variant="gold" onClick={handleSaveAutoLock}>
            Save auto-lock
          </Button>
          {autoLockSaved && <span className="settings-saved">Saved!</span>}
        </div>
      </section>

      {/* ── Change passcode ───────────────────────────────────────────────── */}
      <section className="card settings-section" aria-labelledby="passcode-heading">
        <h3 className="settings-heading" id="passcode-heading">Change passcode</h3>
        <form onSubmit={handleChangePasscode} noValidate>
          <div className="settings-field">
            <label className="settings-label" htmlFor="cp-old">Current passcode</label>
            <input
              id="cp-old"
              type="password"
              className="settings-input"
              autoComplete="current-password"
              value={cpOld}
              onChange={(e) => { setCpOld(e.target.value); setCpError(''); setCpSuccess(false) }}
              disabled={cpBusy}
            />
          </div>
          <div className="settings-field">
            <label className="settings-label" htmlFor="cp-new">New passcode</label>
            <input
              id="cp-new"
              type="password"
              className="settings-input"
              autoComplete="new-password"
              value={cpNew}
              onChange={(e) => { setCpNew(e.target.value); setCpError(''); setCpSuccess(false) }}
              disabled={cpBusy}
            />
          </div>
          <div className="settings-field">
            <label className="settings-label" htmlFor="cp-confirm">Confirm new passcode</label>
            <input
              id="cp-confirm"
              type="password"
              className="settings-input"
              autoComplete="new-password"
              value={cpConfirm}
              onChange={(e) => { setCpConfirm(e.target.value); setCpError(''); setCpSuccess(false) }}
              disabled={cpBusy}
            />
          </div>

          {cpError   && <p className="settings-error">{cpError}</p>}
          {cpSuccess && <p className="settings-success">Passcode changed successfully.</p>}

          <div className="settings-actions">
            <Button variant="ink" type="submit" disabled={cpBusy}>
              {cpBusy ? 'Updating…' : 'Change passcode'}
            </Button>
          </div>
        </form>
      </section>

      {/* ── Export / Import ───────────────────────────────────────────────── */}
      <section className="card settings-section" aria-labelledby="data-heading">
        <h3 className="settings-heading" id="data-heading">Export / Import data</h3>
        <p className="settings-hint">
          Export saves an <strong>unencrypted</strong> JSON backup to your device.
          Keep it safe — it contains all your tax data in plaintext.
        </p>

        <div className="settings-actions" style={{ flexWrap: 'wrap', gap: 10 }}>
          <Button variant="gold" onClick={handleExport}>
            Export JSON backup
          </Button>
          <Button variant="ghost" onClick={() => importRef.current?.click()}>
            Import JSON
          </Button>
          <input
            ref={importRef}
            type="file"
            accept=".json,application/json"
            style={{ display: 'none' }}
            onChange={handleImportFile}
            aria-label="Import JSON file"
          />
        </div>

        {importError   && <p className="settings-error"   style={{ marginTop: 8 }}>{importError}</p>}
        {importSuccess && <p className="settings-success" style={{ marginTop: 8 }}>Import successful.</p>}
      </section>

      {/* ── Manual lock ───────────────────────────────────────────────────── */}
      <section className="card settings-section" aria-labelledby="lock-heading">
        <h3 className="settings-heading" id="lock-heading">Lock</h3>
        <p className="settings-hint">Lock the app now and require your passcode to access it again.</p>
        <div className="settings-actions">
          <Button variant="ink" onClick={lock}>
            Lock now
          </Button>
        </div>
      </section>

      {/* ── Reset app ─────────────────────────────────────────────────────── */}
      <section className="card settings-section settings-danger" aria-labelledby="reset-heading">
        <h3 className="settings-heading" id="reset-heading">Reset app</h3>
        <p className="settings-hint">
          Permanently delete all encrypted data from this device. This cannot be undone.
          If you have not exported a backup, your data will be lost forever.
        </p>

        {!resetExpanded ? (
          <div className="settings-actions">
            <Button variant="ghost" className="settings-danger-btn" onClick={() => setResetExpanded(true)}>
              Reset app
            </Button>
          </div>
        ) : (
          <div className="settings-reset-confirm">
            <p className="settings-reset-prompt">
              Type <strong>RESET</strong> below to confirm permanent data deletion:
            </p>
            <input
              className="settings-input"
              type="text"
              placeholder="Type RESET to confirm"
              value={resetInput}
              onChange={(e) => { setResetInput(e.target.value); setResetError('') }}
              aria-label="Confirm reset by typing RESET"
            />
            {resetError && <p className="settings-error">{resetError}</p>}
            <div className="settings-actions" style={{ gap: 10 }}>
              <Button
                variant="ghost"
                onClick={() => { setResetExpanded(false); setResetInput(''); setResetError('') }}
              >
                Cancel
              </Button>
              <Button
                variant="ink"
                className="settings-danger-btn"
                onClick={handleResetConfirm}
              >
                I understand, wipe data
              </Button>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
