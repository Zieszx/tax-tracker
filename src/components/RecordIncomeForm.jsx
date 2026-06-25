/**
 * RecordIncomeForm.jsx — flexible monthly income submission.
 *
 * Pick any month (past / current / future) and record that month's main salary,
 * part-time (quick total OR itemized payments) and PCB/MTD. Saving marks the
 * month as "actual" (confirmed:true) and pins its figures; un-recorded months
 * stay projected from the income sources.
 *
 * Writes through useProfile().setYear → encrypted active-year vault. The tax
 * engine is untouched — `confirmed` is UI metadata.
 */

import { useState, useEffect } from 'react'
import { useProfile } from '../hooks/useProfile.js'
import { materializeMonths } from '../state/materialize.js'
import { formatRM } from '../engine/format.js'
import Button from './Button.jsx'

/** Pure: the month to default the form to — current month if we're viewing the
 *  current calendar year, otherwise January of the active year. */
export function defaultRecordMonth(taxYear, now = new Date()) {
  if (now.getFullYear() === taxYear) {
    return `${taxYear}-${String(now.getMonth() + 1).padStart(2, '0')}`
  }
  return `${taxYear}-01`
}

function monthKeys(taxYear) {
  return Array.from({ length: 12 }, (_, i) => `${taxYear}-${String(i + 1).padStart(2, '0')}`)
}

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
function monthLabel(key) {
  const m = parseInt(key.slice(5), 10)
  return `${MONTH_LABELS[m - 1]} ${key.slice(0, 4)}`
}

export default function RecordIncomeForm() {
  const ctx = useProfile()
  const year = ctx?.year
  const setYear = ctx?.setYear
  const taxYear = year?.taxYear ?? 2026

  const months = monthKeys(taxYear)
  const [month, setMonth] = useState(() => defaultRecordMonth(taxYear))

  const [mainSalary, setMainSalary] = useState('')
  const [partMode, setPartMode] = useState('total') // 'total' | 'itemized'
  const [partTotal, setPartTotal] = useState('')
  const [partItems, setPartItems] = useState([]) // [{ date, amount }]
  const [pcb, setPcb] = useState('')
  const [recorded, setRecorded] = useState(false)

  // Projected (source-only) values for placeholders
  const projectedSourceOnly = materializeMonths(year?.incomeSources ?? [], {}, taxYear)
  const projOf = (mk) => projectedSourceOnly.find((x) => x.month === mk)

  const override = year?.monthOverrides?.[month]
  const isActual = !!override?.confirmed
  const projMain = projOf(month)?.mainSalary ?? 0
  const projPart = (projOf(month)?.partTime ?? []).reduce((s, p) => s + (p.amount || 0), 0)

  // Load the selected month's current values into the form
  useEffect(() => {
    const ov = year?.monthOverrides?.[month]
    const proj = projectedSourceOnly.find((x) => x.month === month)
    const curMain = ov?.mainSalary ?? proj?.mainSalary ?? 0
    const curPart = ov?.partTime ?? proj?.partTime ?? []
    const itemized = curPart.length > 1 || curPart.some((p) => !String(p.date).endsWith('-15'))
    const partSum = curPart.reduce((s, p) => s + (p.amount || 0), 0)
    const pcbAmt = (year?.pcbPaid ?? []).find((p) => p.month === month)?.amount ?? 0

    setMainSalary(curMain ? String(curMain) : '')
    setPartMode(itemized ? 'itemized' : 'total')
    setPartTotal(partSum ? String(partSum) : '')
    setPartItems(curPart.map((p) => ({ date: p.date, amount: String(p.amount) })))
    setPcb(pcbAmt ? String(pcbAmt) : '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, year])

  // Reset the "Recorded ✓" flash when switching months
  useEffect(() => { setRecorded(false) }, [month])

  function buildPartTime() {
    if (partMode === 'total') {
      const amt = parseFloat(partTotal) || 0
      return amt > 0 ? [{ date: `${month}-15`, amount: amt, note: 'Monthly total' }] : []
    }
    return partItems
      .filter((it) => (parseFloat(it.amount) || 0) > 0)
      .map((it) => ({ date: it.date || `${month}-15`, amount: parseFloat(it.amount) || 0, note: '' }))
  }

  async function handleSave() {
    if (!setYear) return
    const main = parseFloat(mainSalary) || 0
    const partTime = buildPartTime()
    const pcbAmt = parseFloat(pcb) || 0
    await setYear((yr) => {
      const monthOverrides = {
        ...yr.monthOverrides,
        [month]: { mainSalary: main, partTime, confirmed: true },
      }
      let pcbPaid = (yr.pcbPaid ?? []).filter((p) => p.month !== month)
      if (pcbAmt > 0) pcbPaid = [...pcbPaid, { month, amount: pcbAmt, ref: 'Recorded' }]
      return { ...yr, monthOverrides, pcbPaid }
    })
    setRecorded(true)
    setTimeout(() => setRecorded(false), 2500)
  }

  async function handleClear() {
    if (!setYear) return
    await setYear((yr) => {
      const monthOverrides = { ...yr.monthOverrides }
      delete monthOverrides[month]
      const pcbPaid = (yr.pcbPaid ?? []).filter((p) => p.month !== month)
      return { ...yr, monthOverrides, pcbPaid }
    })
    setRecorded(false)
  }

  const addItem = () => setPartItems((it) => [...it, { date: `${month}-15`, amount: '' }])
  const setItem = (i, field, val) =>
    setPartItems((it) => it.map((row, idx) => (idx === i ? { ...row, [field]: val } : row)))
  const removeItem = (i) => setPartItems((it) => it.filter((_, idx) => idx !== i))

  return (
    <section className="card record-form">
      <div className="record-form-head">
        <h3 className="income-section-title" style={{ margin: 0 }}>Record income</h3>
        <span className={`record-status-badge ${isActual ? 'is-actual' : 'is-projected'}`}>
          {isActual ? '● Actual' : '○ Projected'}
        </span>
      </div>

      <div className="record-grid">
        <label className="field">
          <span>Month</span>
          <select aria-label="record month" value={month} onChange={(e) => setMonth(e.target.value)}>
            {months.map((mk) => (
              <option key={mk} value={mk}>{monthLabel(mk)}</option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Main salary (RM)</span>
          <input
            type="number" aria-label="record main salary" min="0" step="100"
            value={mainSalary} placeholder={formatRM(projMain)}
            onChange={(e) => setMainSalary(e.target.value)}
          />
        </label>

        <label className="field">
          <span>PCB / MTD deducted (RM)</span>
          <input
            type="number" aria-label="record pcb" min="0" step="10"
            value={pcb} placeholder="0.00"
            onChange={(e) => setPcb(e.target.value)}
          />
        </label>
      </div>

      {/* Part-time: total or itemized */}
      <div className="record-part">
        <div className="record-part-head">
          <span className="field-label-text">Part-time</span>
          <div className="record-part-toggle" role="group" aria-label="part-time mode">
            <button
              type="button"
              className={`toggle-chip ${partMode === 'total' ? 'active' : ''}`}
              onClick={() => setPartMode('total')}
            >Total</button>
            <button
              type="button"
              className={`toggle-chip ${partMode === 'itemized' ? 'active' : ''}`}
              onClick={() => setPartMode('itemized')}
            >Itemized</button>
          </div>
        </div>

        {partMode === 'total' ? (
          <label className="field">
            <span>Part-time total (RM)</span>
            <input
              type="number" aria-label="record part-time total" min="0" step="50"
              value={partTotal} placeholder={formatRM(projPart)}
              onChange={(e) => setPartTotal(e.target.value)}
            />
          </label>
        ) : (
          <div className="record-items">
            {partItems.map((it, i) => (
              <div className="record-item-row" key={i}>
                <input
                  type="date" aria-label={`payment date ${i + 1}`}
                  value={it.date} onChange={(e) => setItem(i, 'date', e.target.value)}
                />
                <input
                  type="number" aria-label={`payment amount ${i + 1}`} min="0" step="50"
                  value={it.amount} placeholder="0.00"
                  onChange={(e) => setItem(i, 'amount', e.target.value)}
                />
                <button type="button" className="override-clear-btn" aria-label={`remove payment ${i + 1}`} onClick={() => removeItem(i)}>✕</button>
              </div>
            ))}
            <button type="button" className="btn btn-ghost" onClick={addItem}>+ Add payment</button>
          </div>
        )}
      </div>

      <div className="record-actions">
        <Button variant="gold" onClick={handleSave}>Record as actual</Button>
        {isActual && (
          <Button variant="ghost" onClick={handleClear}>Clear (revert to projected)</Button>
        )}
        {recorded && <span className="settings-saved">Recorded ✓</span>}
      </div>
    </section>
  )
}
