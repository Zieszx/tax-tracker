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

  // Override log helpers
  function setOverrideMain(monthKey, value) {
    setYear((yr) => ({
      ...yr,
      monthOverrides: {
        ...yr.monthOverrides,
        [monthKey]: {
          ...(yr.monthOverrides[monthKey] ?? {}),
          mainSalary: parseFloat(value) || 0,
        },
      },
    }))
  }

  function clearOverride(monthKey) {
    setYear((yr) => {
      const next = { ...yr.monthOverrides }
      delete next[monthKey]
      return { ...yr, monthOverrides: next }
    })
  }

  return (
    <div>
      <h2 className="page-title">Income</h2>
      <p className="subtitle">
        Define your income sources. The engine projects all 12 months automatically —
        override individual months below where needed.
      </p>

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
          The table below shows the projected income for each month. Edit the "Override
          main" column to pin a specific gross for that month (overrides the source
          projection). Clear to revert to the projected value.
        </p>

        <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
          <table className="override-table">
            <thead>
              <tr>
                <th>Month</th>
                <th>Projected main (RM)</th>
                <th>Override main (RM)</th>
                <th>Part-time total (RM)</th>
                <th>Month total (RM)</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {months.map((m) => {
                const hasOverride = overrides[m.month]?.mainSalary !== undefined
                const ptTotal = m.partTime.reduce(
                  (s, p) => s + (p.amount || 0),
                  0
                )
                // Projected main (from sources only, ignoring override)
                const projectedMain = materializeMonths(sources, {}, taxYear).find(
                  (x) => x.month === m.month
                )?.mainSalary ?? 0

                return (
                  <tr key={m.month} className="override-row">
                    <td>{m.month}</td>
                    <td className="override-projected">{formatRM(projectedMain)}</td>
                    <td>
                      <input
                        type="number"
                        aria-label={`override main salary ${m.month}`}
                        className="override-input"
                        value={hasOverride ? m.mainSalary : ''}
                        placeholder={formatRM(projectedMain)}
                        onChange={(e) => setOverrideMain(m.month, e.target.value)}
                        min="0"
                        step="100"
                      />
                    </td>
                    <td>{formatRM(ptTotal)}</td>
                    <td>{formatRM(m.mainSalary + ptTotal)}</td>
                    <td>
                      {hasOverride && (
                        <button
                          className="override-clear-btn"
                          aria-label={`clear override ${m.month}`}
                          onClick={() => clearOverride(m.month)}
                          title="Clear override"
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
