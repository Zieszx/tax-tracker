/**
 * SavingsCard.jsx — Task 3.3: Set-aside savings tracker
 *
 * Shows:
 *   - Target: max(0, result.balance) — projected amount due
 *   - Total set aside: sum of year.savings.entries[].amount
 *   - ProgressBar: total / target
 *   - Suggested monthly amount: remaining / remainingMonths (months left in year)
 *   - Add-entry control (month + amount) → writes via setYear
 */

import { useState, useMemo } from 'react'
import { useProfile } from '../hooks/useProfile.js'
import ProgressBar from './ProgressBar.jsx'
import { formatRM } from '../engine/format.js'

function remainingMonthsInYear() {
  const now = new Date()
  // months left including current month (1-indexed; 12 months total)
  return Math.max(1, 12 - now.getMonth())
}

function currentMonthKey() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

export default function SavingsCard() {
  const { result, year, activeYear, setYear } = useProfile()

  const [amount, setAmount] = useState('')
  const [month, setMonth] = useState(currentMonthKey())
  const [error, setError] = useState('')

  // target = max(0, balance due)
  const target = useMemo(() => Math.max(0, result?.balance ?? 0), [result])

  // entries from vault
  const entries = year?.savings?.entries ?? []

  // total set aside
  const total = useMemo(() => entries.reduce((s, e) => s + (e.amount ?? 0), 0), [entries])

  // suggested monthly: (target - total) / remainingMonths, floored at 0
  const remaining = Math.max(0, target - total)
  const suggested = remaining > 0 ? remaining / remainingMonthsInYear() : 0

  async function handleAdd() {
    const parsed = parseFloat(amount)
    if (!amount || isNaN(parsed) || parsed <= 0) {
      setError('Enter a valid positive amount.')
      return
    }
    if (!month) {
      setError('Select a month.')
      return
    }
    setError('')

    await setYear((yr) => ({
      ...yr,
      savings: {
        ...yr.savings,
        entries: [...(yr.savings?.entries ?? []), { month, amount: parsed }],
      },
    }))

    setAmount('')
  }

  return (
    <div className="card savings-card">
      <div className="savings-header">
        <h3 className="savings-title">Set Aside</h3>
        {target > 0 && suggested > 0 && (
          <span className="savings-suggest">
            Suggested: {formatRM(suggested)}/mo
          </span>
        )}
      </div>

      <div className="savings-amounts">
        <div className="savings-amount-block">
          <div className="stat-label">Saved so far</div>
          <div className="stat-value savings-value" data-testid="savings-total">
            {formatRM(total)}
          </div>
        </div>
        <div className="savings-amount-block">
          <div className="stat-label">Target</div>
          <div className="stat-value" style={{ color: 'var(--pink)' }} data-testid="savings-target">
            {formatRM(target)}
          </div>
        </div>
      </div>

      {/* Progress bar: total / target */}
      <ProgressBar value={total} max={target} accent="gold" data-testid="savings-progress" />

      {entries.length > 0 && (
        <ul className="savings-list">
          {entries.map((e, i) => (
            <li key={i} className="savings-entry">
              <span className="savings-entry-month">{e.month}</span>
              <span className="savings-entry-amount">{formatRM(e.amount)}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="savings-add-form">
        <div className="savings-add-fields">
          <div className="field">
            <label htmlFor="savings-month" className="field-label">Month</label>
            <input
              id="savings-month"
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="savings-input"
              min={`${activeYear}-01`}
              max={`${activeYear}-12`}
            />
          </div>
          <div className="field">
            <label htmlFor="savings-amount" className="field-label">Amount (RM)</label>
            <input
              id="savings-amount"
              type="number"
              min="0.01"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="savings-input"
              aria-label="amount"
            />
          </div>
        </div>
        {error && <p className="savings-error">{error}</p>}
        <button
          className="btn btn-gold savings-add-btn"
          onClick={handleAdd}
          aria-label="Add"
        >
          Add
        </button>
      </div>
    </div>
  )
}
