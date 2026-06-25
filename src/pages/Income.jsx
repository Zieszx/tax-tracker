/**
 * Income.jsx — Task 3.1
 *
 * Income page: side-by-side source cards (2-col ≥768px / 1-col below)
 * + month-override log using materializeMonths.
 *
 * Reads:  useProfile() → { year, setYear, result }
 * Writes: setYear(updater) for incomeSources and monthOverrides
 */

import { useState } from 'react'
import { useProfile } from '../hooks/useProfile.js'
import { materializeMonths } from '../state/materialize.js'
import { formatRM } from '../engine/format.js'
import SourceCard from '../components/SourceCard.jsx'
import ImportCsvModal from '../components/ImportCsvModal.jsx'
import RecordIncomeForm, { defaultRecordMonth } from '../components/RecordIncomeForm.jsx'

let _nextId = Date.now()
function newId() {
  return `src-${++_nextId}`
}

function blankSource(type = 'part') {
  return type === 'main'
    ? {
        id: newId(),
        type: 'main',
        name: '',
        monthlyGross: 0,
        monthsActive: { from: 1, to: 12 },
        autoStatutory: true,
      }
    : {
        id: newId(),
        type: 'part',
        name: '',
        amountPerPayment: 0,
        schedule: '1st & 15th',
        monthsActive: { from: 1, to: 12 },
        autoStatutory: false,
      }
}

export default function Income() {
  const ctx = useProfile()

  if (!ctx) {
    return (
      <div>
        <h2 className="page-title">Income</h2>
        <p className="subtitle">Vault is locked.</p>
      </div>
    )
  }

  const { year, setYear } = ctx
  const [csvModalOpen, setCsvModalOpen] = useState(false)
  const sources = year?.incomeSources ?? []
  const overrides = year?.monthOverrides ?? {}
  const taxYear = year?.taxYear ?? 2026
  // The current calendar month, only when viewing the current year.
  const thisMonth = new Date().getFullYear() === taxYear ? defaultRecordMonth(taxYear) : null

  // Projected months from current sources + overrides
  const months = materializeMonths(sources, overrides, taxYear)

  // Projected annual gross (sum of all materialized months)
  const annualGross = months.reduce(
    (sum, m) =>
      sum + m.mainSalary + m.partTime.reduce((s, p) => s + (p.amount || 0), 0),
    0
  )

  // ── mutations ────────────────────────────────────────────────────────────────

  function updateSource(id, updated) {
    setYear((yr) => ({
      ...yr,
      incomeSources: yr.incomeSources.map((s) => (s.id === id ? updated : s)),
    }))
  }

  function removeSource(id) {
    setYear((yr) => ({
      ...yr,
      incomeSources: yr.incomeSources.filter((s) => s.id !== id),
    }))
  }

  function addSource() {
    const src = blankSource('part')
    setYear((yr) => ({
      ...yr,
      incomeSources: [...yr.incomeSources, src],
    }))
  }

  // Override log helpers — main salary and part-time can be overridden
  // independently per month. An empty input clears just that field; when a
  // month has no remaining overrides the whole entry is removed.
  function setOverrideField(monthKey, field, value) {
    setYear((yr) => {
      const existing = yr.monthOverrides[monthKey] ?? {}
      const next = { ...existing }
      const blank = value === '' || value == null
      if (field === 'mainSalary') {
        if (blank) delete next.mainSalary
        else next.mainSalary = parseFloat(value) || 0
      } else if (field === 'partTime') {
        if (blank) delete next.partTime
        else next.partTime = [{ date: `${monthKey}-15`, amount: parseFloat(value) || 0, note: 'Manual override' }]
      }
      const nextOverrides = { ...yr.monthOverrides }
      if (Object.keys(next).length === 0) delete nextOverrides[monthKey]
      else nextOverrides[monthKey] = next
      return { ...yr, monthOverrides: nextOverrides }
    })
  }

  function clearOverride(monthKey) {
    setYear((yr) => {
      const next = { ...yr.monthOverrides }
      delete next[monthKey]
      return { ...yr, monthOverrides: next }
    })
  }

  // Projected (source-only) months — used for placeholder values in the log
  const projectedMonths = materializeMonths(sources, {}, taxYear)
  const projectedOf = (monthKey) => projectedMonths.find((x) => x.month === monthKey)

  return (
    <div>
      <h2 className="page-title">Income</h2>
      <p className="subtitle">
        Record each month's actual income as it happens, or define income sources that
        project the rest of the year. Override any individual month below.
      </p>

      {/* ── Record income (flexible monthly submission) ───────────────────── */}
      <RecordIncomeForm />

      {/* ── Section: Income Sources ───────────────────────────────────────── */}
      <section className="income-section">
        <div className="income-section-header">
          <h3 className="income-section-title">Income Sources</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="btn btn-ghost"
              onClick={() => setCsvModalOpen(true)}
              aria-label="import bank CSV"
            >
              ↑ Import CSV
            </button>
            <button
              className="btn btn-gold"
              onClick={addSource}
              aria-label="add part-time source"
            >
              + Add Source
            </button>
          </div>
        </div>

        {sources.length === 0 ? (
          <div className="card income-empty">
            <p>No income sources yet. Add one to start projecting.</p>
          </div>
        ) : (
          <div className="sources-grid">
            {sources.map((src) => (
              <SourceCard
                key={src.id}
                source={src}
                onChange={(updated) => updateSource(src.id, updated)}
                onRemove={() => removeSource(src.id)}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── Projected annual gross ────────────────────────────────────────── */}
      <div className="card income-annual" style={{ marginTop: 16, marginBottom: 24 }}>
        <span className="stat-label">Projected annual gross</span>
        <span className="stat-value income-annual-value">{formatRM(annualGross)}</span>
      </div>

      {/* ── CSV Import Modal ─────────────────────────────────────────────── */}
      <ImportCsvModal
        open={csvModalOpen}
        onClose={() => setCsvModalOpen(false)}
        setYear={setYear}
        year={year}
      />

      {/* ── Section: Month Override Log ───────────────────────────────────── */}
      <section className="income-section">
        <h3 className="income-section-title">Month Override Log</h3>
        <p className="stat-hint" style={{ marginBottom: 12 }}>
          The table shows the projected income for each month. Your salary isn't static —
          edit <strong>Override main</strong> to pin a specific gross (e.g. RM 4,000 one
          month, RM 4,500 another), and <strong>Override part-time</strong> to set that
          month's part-time total. Leave a field blank to use the projected value; ✕ clears
          the whole month.
        </p>

        <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
          <table className="override-table">
            <thead>
              <tr>
                <th>Month</th>
                <th>Status</th>
                <th>Projected main (RM)</th>
                <th>Override main (RM)</th>
                <th>Projected part-time (RM)</th>
                <th>Override part-time (RM)</th>
                <th>Month total (RM)</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {months.map((m) => {
                const mainOverridden = overrides[m.month]?.mainSalary !== undefined
                const partOverridden = overrides[m.month]?.partTime !== undefined
                const isActual = overrides[m.month]?.confirmed === true
                const hasOverride = mainOverridden || partOverridden
                const isCurrent = m.month === thisMonth
                const ptTotal = m.partTime.reduce((s, p) => s + (p.amount || 0), 0)

                const proj = projectedOf(m.month)
                const projectedMain = proj?.mainSalary ?? 0
                const projectedPart = (proj?.partTime ?? []).reduce(
                  (s, p) => s + (p.amount || 0),
                  0
                )

                return (
                  <tr key={m.month} className={`override-row${isCurrent ? ' is-current' : ''}`}>
                    <td>
                      {m.month}
                      {isCurrent && <span className="current-tag">this month</span>}
                    </td>
                    <td>
                      <span className={`override-status ${isActual ? 'is-actual' : 'is-projected'}`}>
                        {isActual ? 'Actual' : 'Projected'}
                      </span>
                    </td>
                    <td className="override-projected">{formatRM(projectedMain)}</td>
                    <td>
                      <input
                        type="number"
                        aria-label={`override main salary ${m.month}`}
                        className="override-input"
                        value={mainOverridden ? m.mainSalary : ''}
                        placeholder={formatRM(projectedMain)}
                        onChange={(e) => setOverrideField(m.month, 'mainSalary', e.target.value)}
                        min="0"
                        step="100"
                      />
                    </td>
                    <td className="override-projected">{formatRM(projectedPart)}</td>
                    <td>
                      <input
                        type="number"
                        aria-label={`override part-time ${m.month}`}
                        className="override-input"
                        value={partOverridden ? ptTotal : ''}
                        placeholder={formatRM(projectedPart)}
                        onChange={(e) => setOverrideField(m.month, 'partTime', e.target.value)}
                        min="0"
                        step="50"
                      />
                    </td>
                    <td>{formatRM(m.mainSalary + ptTotal)}</td>
                    <td>
                      {hasOverride && (
                        <button
                          className="override-clear-btn"
                          aria-label={`clear override ${m.month}`}
                          onClick={() => clearOverride(m.month)}
                          title="Clear month overrides"
                        >
                          ✕
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
