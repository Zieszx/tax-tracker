import { useProfile } from '../hooks/useProfile.js'
import ProgressBar from '../components/ProgressBar.jsx'
import { formatRM } from '../engine/format.js'
import { computeTax } from '../engine/tax.js'

export default function Reliefs() {
  const { profile, setProfile, result } = useProfile()

  const setAmount = (key, val) => {
    const reliefs = profile.reliefs.map((r) => r.key === key
      ? { ...r, amount: parseFloat(val) || 0 } : r)
    setProfile({ ...profile, reliefs })
  }

  // What-if: tax saved if this relief is topped up to its limit.
  const savingIfMaxed = (relief) => {
    const headroom = (relief.limit ?? 0) - relief.amount
    if (headroom <= 0) return 0
    const bumped = {
      ...profile,
      reliefs: profile.reliefs.map((r) => r.key === relief.key ? { ...r, amount: relief.limit } : r),
    }
    return result.grossTax - computeTax(bumped).grossTax
  }

  return (
    <div>
      <h2 className="page-title">Reliefs</h2>
      <p className="subtitle">Maximise your reliefs to lower chargeable income.</p>

      <div className="grid-auto-wide" style={{ alignItems: 'start' }}>
        {profile.reliefs.map((r) => {
          const saving = savingIfMaxed(r)
          const pct = r.limit > 0 ? Math.min(100, (r.amount / r.limit) * 100) : 0
          return (
            <div className="card relief" key={r.key}>
              <div className="relief-head">
                <strong style={{ fontWeight: 800 }}>{r.label}</strong>
                <span className="stat-hint">
                  limit {formatRM(r.limit)}
                  {pct >= 100 && <span style={{ marginLeft: 6, color: 'var(--positive)', fontWeight: 700 }}>✓ maxed</span>}
                </span>
              </div>
              <label className="field">
                <span>Amount claimed</span>
                <input type="number" aria-label={`${r.label} amount`}
                  value={r.amount} disabled={r.auto}
                  onChange={(e) => setAmount(r.key, e.target.value)} />
              </label>
              <ProgressBar value={r.amount} max={r.limit}
                accent={r.amount >= r.limit ? 'positive' : 'gold'} />
              {saving > 0.5 && (
                <div className="relief-hint">
                  💡 Top up to {formatRM(r.limit)} → save about {formatRM(saving)} in tax.
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="card" style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="stat-label">Total reliefs</span>
        <strong style={{ fontSize: 22, fontWeight: 800, color: 'var(--gold)' }}>{formatRM(result.totalReliefs)}</strong>
      </div>
    </div>
  )
}
