/**
 * Income.jsx — Task B4
 *
 * Income page with tabbed layout: Months / Sources / Import.
 *
 * - Months tab: MonthsSummary (sticky) + featured current-month MonthCard +
 *   .grid-auto-wide of 12 MonthCards + Bulk actions. Old override table removed.
 * - Sources tab: SourceCard grid + projected annual gross.
 * - Import tab: CSV import trigger + ImportCsvModal.
 *
 * Reads:  useProfile() → { year, setYear, result, activeYear }
 * Writes: setYear(updater) for incomeSources and monthOverrides
 */

import { useState } from 'react'
import { useProfile } from '../hooks/useProfile.js'
import { materializeMonths } from '../state/materialize.js'
import { formatRM } from '../engine/format.js'
import SourceCard from '../components/SourceCard.jsx'
import ImportCsvModal from '../components/ImportCsvModal.jsx'
import MonthCard from '../components/MonthCard.jsx'
import MonthsSummary from '../components/MonthsSummary.jsx'
import Tabs from '../components/Tabs.jsx'
import {
  copyMonthToRest,
  fillProjectedFromAverage,
  applyMainToAll,
} from '../state/incomeBulk.js'
import { defaultRecordMonth } from '../state/currentMonth.js'

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

const INCOME_TABS = [
  { id: 'months', label: 'Months' },
  { id: 'sources', label: 'Sources' },
  { id: 'import', label: 'Import' },
]

const BULK_ACTIONS = [
  { id: 'applyMainToAll', label: 'Set main salary for all months…' },
  { id: 'copyMonthToRest', label: 'Copy this month to remaining months…' },
  { id: 'fillProjectedFromAverage', label: 'Fill unconfirmed from average of actuals' },
]

export default function Income() {
  const ctx = useProfile()

  // Hooks must run on every render — declare them BEFORE any early return so the
  // hook count stays constant regardless of vault state (Rules of Hooks).
  const [tab, setTab] = useState('months')
  const [csvModalOpen, setCsvModalOpen] = useState(false)

  // Bulk-action state
  const [bulkAction, setBulkAction] = useState('')
  const [bulkAmount, setBulkAmount] = useState('')
  const [bulkFromMonth, setBulkFromMonth] = useState('')
  const [bulkConfirmMsg, setBulkConfirmMsg] = useState('')

  if (!ctx) {
    return (
      <div>
        <h2 className="page-title">Income</h2>
        <p className="subtitle">Vault is locked.</p>
      </div>
    )
  }

  const { year, setYear } = ctx
  const sources = year?.incomeSources ?? []
  const overrides = year?.monthOverrides ?? {}
  const taxYear = year?.taxYear ?? 2026

  // The current calendar month, only when viewing the current year.
  const thisMonth = new Date().getFullYear() === taxYear ? defaultRecordMonth(taxYear) : null

  // Projected months from current sources + overrides
  const months = materializeMonths(sources, overrides, taxYear)

  // Projected (source-only) months — for placeholder values in MonthCards
  const projectedMonths = materializeMonths(sources, {}, taxYear)
  const projectedOf = (monthKey) => projectedMonths.find((x) => x.month === monthKey)

  // Projected annual gross
  const annualGross = months.reduce(
    (sum, m) =>
      sum + m.mainSalary + m.partTime.reduce((s, p) => s + (p.amount || 0), 0),
    0
  )

  // ── Source mutations ──────────────────────────────────────────────────────

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

  // ── MonthCard mutations ───────────────────────────────────────────────────

  function handleMonthChange(monthKey, patch) {
    setYear((yr) => {
      const existing = yr.monthOverrides[monthKey] ?? {}
      let next = { ...existing }

      if (patch.mainSalary !== undefined) {
        next.mainSalary = patch.mainSalary
      }
      if (patch.partTimeTotal !== undefined) {
        next.partTime = [
          { date: `${monthKey}-15`, amount: patch.partTimeTotal, note: 'Manual override' },
        ]
      }
      if (patch.pcb !== undefined) {
        // PCB is stored in pcbPaid[], not monthOverrides — handle separately below
      }

      const nextOverrides = { ...yr.monthOverrides, [monthKey]: next }

      // PCB write
      let nextPcbPaid = yr.pcbPaid ?? []
      if (patch.pcb !== undefined) {
        nextPcbPaid = nextPcbPaid.filter((p) => p.month !== monthKey)
        if (patch.pcb > 0) {
          nextPcbPaid = [...nextPcbPaid, { month: monthKey, amount: patch.pcb, ref: 'Card' }]
        }
      }

      return { ...yr, monthOverrides: nextOverrides, pcbPaid: nextPcbPaid }
    })
  }

  function handleMonthRecord(monthKey) {
    setYear((yr) => {
      const existing = yr.monthOverrides[monthKey] ?? {}
      // Get effective values from materialization
      const m = months.find((x) => x.month === monthKey)
      return {
        ...yr,
        monthOverrides: {
          ...yr.monthOverrides,
          [monthKey]: {
            ...existing,
            mainSalary: existing.mainSalary ?? m?.mainSalary ?? 0,
            partTime: existing.partTime ?? m?.partTime ?? [],
            confirmed: true,
          },
        },
      }
    })
  }

  function handleMonthClear(monthKey) {
    setYear((yr) => {
      const next = { ...yr.monthOverrides }
      delete next[monthKey]
      const pcbPaid = (yr.pcbPaid ?? []).filter((p) => p.month !== monthKey)
      return { ...yr, monthOverrides: next, pcbPaid }
    })
  }

  // ── Bulk actions ──────────────────────────────────────────────────────────

  function buildBulkConfirmMsg(action) {
    if (action === 'applyMainToAll') {
      const amt = parseFloat(bulkAmount) || 0
      return `Set main salary to ${formatRM(amt)} for all 12 months?`
    }
    if (action === 'copyMonthToRest') {
      const from = bulkFromMonth || thisMonth || months[0]?.month || ''
      return `Copy ${from} income to all remaining months?`
    }
    if (action === 'fillProjectedFromAverage') {
      return 'Fill all unconfirmed months with the average of your confirmed actuals?'
    }
    return ''
  }

  function handleBulkSelect(action) {
    setBulkAction(action)
    setBulkConfirmMsg('')
    if (action === 'copyMonthToRest' && !bulkFromMonth) {
      setBulkFromMonth(thisMonth || months[0]?.month || '')
    }
  }

  function handleBulkPreview() {
    setBulkConfirmMsg(buildBulkConfirmMsg(bulkAction))
  }

  function handleBulkConfirm() {
    if (!bulkAction) return
    setYear((yr) => {
      let nextOverrides
      if (bulkAction === 'applyMainToAll') {
        const amt = parseFloat(bulkAmount) || 0
        nextOverrides = applyMainToAll(yr, amt)
      } else if (bulkAction === 'copyMonthToRest') {
        const from = bulkFromMonth || thisMonth || months[0]?.month || ''
        nextOverrides = copyMonthToRest(yr, from)
      } else if (bulkAction === 'fillProjectedFromAverage') {
        nextOverrides = fillProjectedFromAverage(yr)
      } else {
        return yr
      }
      return { ...yr, monthOverrides: nextOverrides }
    })
    setBulkAction('')
    setBulkAmount('')
    setBulkFromMonth('')
    setBulkConfirmMsg('')
  }

  function handleBulkCancel() {
    setBulkAction('')
    setBulkAmount('')
    setBulkFromMonth('')
    setBulkConfirmMsg('')
  }

  return (
    <div>
      <h2 className="page-title">Income</h2>
      <p className="subtitle">
        Record each month's actual income as it happens, or define income sources that
        project the rest of the year.
      </p>

      {/* ── Tab navigation ─────────────────────────────────────────────────── */}
      <Tabs tabs={INCOME_TABS} active={tab} onChange={setTab} />

      {/* ── Months panel ───────────────────────────────────────────────────── */}
      {tab === 'months' && (
        <div
          role="tabpanel"
          id="panel-months"
          aria-labelledby="tab-months"
          className="tab-panel"
        >
          {/* ── Summary bar + mini chart (sticky) ───────────────────────────── */}
          <div className="months-summary-sticky">
            <MonthsSummary />
          </div>

          {/* ── Featured current-month card ──────────────────────────────────── */}
          {thisMonth && (
            <section className="income-section months-featured-section">
              <h3 className="income-section-title">This month</h3>
              <div className="months-featured-card">
                {(() => {
                  const m = months.find((x) => x.month === thisMonth)
                  const pcbEntry = (year?.pcbPaid ?? []).find((p) => p.month === thisMonth)
                  return (
                    <MonthCard
                      monthKey={thisMonth}
                      projected={projectedOf(thisMonth)}
                      override={overrides[thisMonth] ?? null}
                      pcb={pcbEntry?.amount ?? 0}
                      onChange={(patch) => handleMonthChange(thisMonth, patch)}
                      onRecord={() => handleMonthRecord(thisMonth)}
                      onClear={() => handleMonthClear(thisMonth)}
                      isCurrent={true}
                    />
                  )
                })()}
              </div>
            </section>
          )}

          {/* ── All 12 months grid ───────────────────────────────────────────── */}
          <section className="income-section">
            <h3 className="income-section-title">All months</h3>
            <div className="grid-auto-wide months-grid" aria-label="month cards">
              {/* Exclude the current month — it is shown in the featured card above
                  (avoids a duplicate card and duplicate aria-labels). */}
              {months.filter((m) => m.month !== thisMonth).map((m) => {
                const pcbEntry = (year?.pcbPaid ?? []).find((p) => p.month === m.month)
                return (
                  <MonthCard
                    key={m.month}
                    monthKey={m.month}
                    projected={projectedOf(m.month)}
                    override={overrides[m.month] ?? null}
                    pcb={pcbEntry?.amount ?? 0}
                    onChange={(patch) => handleMonthChange(m.month, patch)}
                    onRecord={() => handleMonthRecord(m.month)}
                    onClear={() => handleMonthClear(m.month)}
                    isCurrent={m.month === thisMonth}
                  />
                )
              })}
            </div>
          </section>

          {/* ── Bulk actions panel ────────────────────────────────────────────── */}
          <section className="income-section bulk-actions-section">
            <h3 className="income-section-title">Bulk actions</h3>
            <div className="card bulk-actions-card">
              <div className="bulk-actions-row">
                {BULK_ACTIONS.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    className={`btn btn-ghost bulk-action-btn${bulkAction === a.id ? ' bulk-action-btn-active' : ''}`}
                    aria-label={a.label}
                    onClick={() => handleBulkSelect(a.id)}
                  >
                    {a.label}
                  </button>
                ))}
              </div>

              {/* Inputs for parameterised actions */}
              {bulkAction === 'applyMainToAll' && (
                <div className="bulk-action-inputs">
                  <label className="field bulk-action-field">
                    <span>Main salary amount (RM)</span>
                    <input
                      type="number"
                      aria-label="bulk main salary amount"
                      value={bulkAmount}
                      min="0"
                      step="100"
                      placeholder="e.g. 4500"
                      onChange={(e) => setBulkAmount(e.target.value)}
                    />
                  </label>
                </div>
              )}

              {bulkAction === 'copyMonthToRest' && (
                <div className="bulk-action-inputs">
                  <label className="field bulk-action-field">
                    <span>Copy from month</span>
                    <select
                      aria-label="bulk copy from month"
                      value={bulkFromMonth}
                      onChange={(e) => setBulkFromMonth(e.target.value)}
                    >
                      {months.map((m) => (
                        <option key={m.month} value={m.month}>{m.month}</option>
                      ))}
                    </select>
                  </label>
                </div>
              )}

              {/* Confirm / cancel row */}
              {bulkAction && !bulkConfirmMsg && (
                <div className="bulk-action-confirm-row">
                  <button
                    type="button"
                    className="btn btn-gold"
                    aria-label="preview bulk action"
                    onClick={handleBulkPreview}
                  >
                    Preview
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    aria-label="cancel bulk action"
                    onClick={handleBulkCancel}
                  >
                    Cancel
                  </button>
                </div>
              )}

              {bulkConfirmMsg && (
                <div className="bulk-action-confirm-row">
                  <p className="bulk-action-confirm-msg" aria-live="polite">{bulkConfirmMsg}</p>
                  <button
                    type="button"
                    className="btn btn-gold"
                    aria-label="confirm bulk action"
                    onClick={handleBulkConfirm}
                  >
                    Confirm
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    aria-label="cancel bulk action"
                    onClick={handleBulkCancel}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      {/* ── Sources panel ──────────────────────────────────────────────────── */}
      {tab === 'sources' && (
        <div
          role="tabpanel"
          id="panel-sources"
          aria-labelledby="tab-sources"
          className="tab-panel"
        >
          <section className="income-section">
            <div className="income-section-header">
              <h3 className="income-section-title">Income Sources</h3>
              <button
                className="btn btn-gold"
                onClick={addSource}
                aria-label="add part-time source"
              >
                + Add Source
              </button>
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

          {/* ── Projected annual gross ──────────────────────────────────────── */}
          <div className="card income-annual" style={{ marginTop: 16, marginBottom: 24 }}>
            <span className="stat-label">Projected annual gross</span>
            <span className="stat-value income-annual-value">{formatRM(annualGross)}</span>
          </div>
        </div>
      )}

      {/* ── Import panel ───────────────────────────────────────────────────── */}
      {tab === 'import' && (
        <div
          role="tabpanel"
          id="panel-import"
          aria-labelledby="tab-import"
          className="tab-panel"
        >
          <section className="income-section">
            <div className="income-section-header">
              <h3 className="income-section-title">Import Bank CSV</h3>
            </div>
            <div className="card income-empty">
              <p style={{ marginBottom: 16 }}>
                Import a bank CSV to auto-fill your month overrides. The importer
                reads common Malaysian bank statement formats and maps transactions
                to the correct months.
              </p>
              <button
                className="btn btn-ghost"
                onClick={() => setCsvModalOpen(true)}
                aria-label="import bank CSV"
              >
                ↑ Import CSV
              </button>
            </div>
          </section>
        </div>
      )}

      {/* ── CSV Import Modal (always mounted so it can close from any tab) ── */}
      <ImportCsvModal
        open={csvModalOpen}
        onClose={() => setCsvModalOpen(false)}
        setYear={setYear}
        year={year}
      />
    </div>
  )
}
