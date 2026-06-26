/**
 * MonthCard.jsx — Task B3
 *
 * Inline-editable card for a single income month.
 *
 * Props:
 *   monthKey   — "YYYY-MM" string
 *   projected  — { month, mainSalary, partTime[] } — source-projected values (no override)
 *   override   — { mainSalary?, partTime?, confirmed? } | null
 *   pcb        — number — PCB/MTD amount paid this month
 *   onChange   — (patch: { mainSalary?, partTimeTotal?, pcb? }) => void
 *   onRecord   — () => void — marks month confirmed
 *   onClear    — () => void — removes override + PCB
 *   isCurrent  — boolean — show "This month" marker
 *
 * Behaviour:
 *   - Status badge: "Actual" (gold) when confirmed, "Projected" (muted) otherwise
 *   - Inline number inputs for main, part-time total, PCB
 *   - "Itemize" toggle to switch between total and per-payment view
 *   - Record button → calls onRecord
 *   - Clear button (only when override exists) → calls onClear
 *   - Actual cards get a gold accent border
 */

import { useState } from 'react'
import { formatRM } from '../engine/format.js'

const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function monthLabel(key) {
  const m = parseInt(key.slice(5), 10)
  return `${MONTH_LABELS[m - 1]} ${key.slice(0, 4)}`
}

export default function MonthCard({
  monthKey,
  projected,
  override,
  pcb,
  onChange,
  onRecord,
  onClear,
  isCurrent,
}) {
  const [partMode, setPartMode] = useState('total')

  const isActual = !!override?.confirmed
  const hasOverride = override != null

  // Effective values (override wins over projected)
  const effectiveMain = override?.mainSalary ?? projected?.mainSalary ?? 0
  const effectivePart = override?.partTime ?? projected?.partTime ?? []
  const partTotal = effectivePart.reduce((s, p) => s + (p.amount || 0), 0)

  function handleMainChange(e) {
    const val = parseFloat(e.target.value)
    onChange({ mainSalary: isNaN(val) ? 0 : val })
  }

  function handlePartChange(e) {
    const val = parseFloat(e.target.value)
    onChange({ partTimeTotal: isNaN(val) ? 0 : val })
  }

  function handlePcbChange(e) {
    const val = parseFloat(e.target.value)
    onChange({ pcb: isNaN(val) ? 0 : val })
  }

  const monthTotal = effectiveMain + partTotal
  const label = monthLabel(monthKey)

  return (
    <article
      className={`card month-card${isActual ? ' month-card-actual' : ''}${isCurrent ? ' month-card-current' : ''}`}
      aria-label={`${label} income card`}
    >
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="month-card-head">
        <div className="month-card-meta">
          <span className="month-card-label">{label}</span>
          {isCurrent && <span className="month-card-this-month">This month</span>}
        </div>
        <span className={`month-card-badge${isActual ? ' month-card-badge-actual' : ' month-card-badge-projected'}`}>
          {isActual ? 'Actual' : 'Projected'}
        </span>
      </div>

      {/* ── Fields ──────────────────────────────────────────────────────────── */}
      <div className="month-card-fields">
        <label className="month-card-field">
          <span className="month-card-field-label">Main salary</span>
          <input
            type="number"
            aria-label={`main salary ${monthKey}`}
            className="month-card-input"
            value={effectiveMain || ''}
            placeholder={formatRM(projected?.mainSalary ?? 0)}
            min="0"
            step="100"
            onChange={handleMainChange}
          />
        </label>

        {/* Part-time with itemize toggle */}
        <div className="month-card-field">
          <div className="month-card-part-head">
            <span className="month-card-field-label">Part-time</span>
            <div className="month-card-part-toggle" role="group" aria-label={`part-time mode ${monthKey}`}>
              <button
                type="button"
                className={`toggle-chip${partMode === 'total' ? ' active' : ''}`}
                onClick={() => setPartMode('total')}
              >
                Total
              </button>
              <button
                type="button"
                className={`toggle-chip${partMode === 'itemized' ? ' active' : ''}`}
                onClick={() => setPartMode('itemized')}
              >
                Itemize
              </button>
            </div>
          </div>
          {partMode === 'total' ? (
            <input
              type="number"
              aria-label={`part-time ${monthKey}`}
              className="month-card-input"
              value={partTotal || ''}
              placeholder="0.00"
              min="0"
              step="50"
              onChange={handlePartChange}
            />
          ) : (
            <div className="month-card-items">
              {effectivePart.map((item, i) => (
                <div key={i} className="month-card-item-row">
                  <span className="month-card-item-date">{item.date}</span>
                  <span className="month-card-item-amount">{formatRM(item.amount)}</span>
                  {item.note && <span className="month-card-item-note">{item.note}</span>}
                </div>
              ))}
              {effectivePart.length === 0 && (
                <span className="month-card-empty-items">No part-time entries</span>
              )}
            </div>
          )}
        </div>

        <label className="month-card-field">
          <span className="month-card-field-label">PCB / MTD</span>
          <input
            type="number"
            aria-label={`pcb ${monthKey}`}
            className="month-card-input"
            value={pcb || ''}
            placeholder="0.00"
            min="0"
            step="10"
            onChange={handlePcbChange}
          />
        </label>
      </div>

      {/* ── Total row ───────────────────────────────────────────────────────── */}
      <div className="month-card-total">
        <span className="month-card-total-label">Month total</span>
        <span className="month-card-total-value">{formatRM(monthTotal)}</span>
      </div>

      {/* ── Actions ─────────────────────────────────────────────────────────── */}
      <div className="month-card-actions">
        <button
          type="button"
          className="btn btn-gold month-card-record-btn"
          aria-label={`record ${monthKey}`}
          onClick={onRecord}
        >
          Record as actual
        </button>
        {hasOverride && (
          <button
            type="button"
            className="btn btn-ghost month-card-clear-btn"
            aria-label={`clear ${monthKey}`}
            onClick={onClear}
          >
            Clear
          </button>
        )}
      </div>
    </article>
  )
}
