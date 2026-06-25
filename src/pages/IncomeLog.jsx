import { useProfile } from '../hooks/useProfile.js'
import { formatRM } from '../engine/format.js'

export default function IncomeLog() {
  const { profile, setProfile } = useProfile()
  const months = profile.income.months

  const update = (next) => setProfile({ ...profile, income: { ...profile.income, months: next } })

  const setMain = (i, val) => {
    const next = months.map((m, idx) => idx === i ? { ...m, mainSalary: parseFloat(val) || 0 } : m)
    update(next)
  }
  const addPart = (i) => {
    const next = months.map((m, idx) => idx === i
      ? { ...m, partTime: [...m.partTime, { id: `${m.month}-${m.partTime.length}-${Date.now()}`, date: `${m.month}-01`, amount: 0, note: '' }] } : m)
    update(next)
  }
  const setPart = (i, j, field, val) => {
    const next = months.map((m, idx) => {
      if (idx !== i) return m
      const pt = m.partTime.map((p, pj) => pj === j
        ? { ...p, [field]: field === 'amount' ? (parseFloat(val) || 0) : val } : p)
      return { ...m, partTime: pt }
    })
    update(next)
  }
  const delPart = (i, j) => {
    const next = months.map((m, idx) => idx === i
      ? { ...m, partTime: m.partTime.filter((_, pj) => pj !== j) } : m)
    update(next)
  }

  const monthTotal = (m) => m.mainSalary + m.partTime.reduce((s, p) => s + p.amount, 0)
  const grand = months.reduce((s, m) => s + monthTotal(m), 0)

  return (
    <div>
      <h2 className="page-title">Income Log</h2>
      <p className="subtitle">Track main salary and part-time payments (1st &amp; 15th DuitNow).</p>

      {months.map((m, i) => (
        <div className="card income-month" key={m.month}>
          <div className="income-head">
            <strong>{m.month}</strong>
            <span className="stat-hint">Total: {formatRM(monthTotal(m))}</span>
          </div>
          <label className="field">
            <span>Main salary (gross)</span>
            <input type="number" aria-label={`main salary ${m.month}`}
              value={m.mainSalary} onChange={(e) => setMain(i, e.target.value)} />
          </label>
          {m.partTime.map((p, j) => (
            <div className="part-row" key={p.id ?? j}>
              <input type="date" aria-label={`part date ${m.month} ${j}`}
                value={p.date} onChange={(e) => setPart(i, j, 'date', e.target.value)} />
              <input type="number" aria-label={`part amount ${m.month} ${j}`}
                value={p.amount} onChange={(e) => setPart(i, j, 'amount', e.target.value)} />
              <input type="text" placeholder="note" aria-label={`part note ${m.month} ${j}`}
                value={p.note} onChange={(e) => setPart(i, j, 'note', e.target.value)} />
              <button onClick={() => delPart(i, j)} aria-label="delete payment">✕</button>
            </div>
          ))}
          <button className="btn-secondary" aria-label={`add part-time payment ${m.month}`} onClick={() => addPart(i)}>+ Add part-time payment</button>
        </div>
      ))}

      <div className="card" style={{ marginTop: 16 }}>
        <strong>Grand total income: {formatRM(grand)}</strong>
      </div>
    </div>
  )
}
