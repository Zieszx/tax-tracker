import { useProfile } from '../hooks/useProfile.js'
import { computeTax } from '../engine/tax.js'
import { formatRM, formatPct } from '../engine/format.js'

export default function TaxCalc() {
  const { profile, result } = useProfile()

  const mainOnly = {
    ...profile,
    income: { months: profile.income.months.map((m) => ({ ...m, partTime: [] })) },
  }
  const maxed = {
    ...profile,
    reliefs: profile.reliefs.map((r) => ({ ...r, amount: r.limit ?? r.amount })),
  }
  const scenarios = [
    { name: 'Main only', r: computeTax(mainOnly) },
    { name: 'Main + part-time', r: result },
    { name: 'Reliefs maxed', r: computeTax(maxed) },
  ]

  return (
    <div>
      <h2 className="page-title">Tax Calculator</h2>
      <p className="subtitle">Transparent, bracket-by-bracket — no black box.</p>

      <div className="taxcalc-split">
        {/* Left: bracket breakdown */}
        <div className="card">
          <div className="stat-label">Tax Breakdown (current)</div>
          <div style={{ overflowX: 'auto' }}>
            <table className="tax-table">
              <thead>
                <tr><th>Band (RM)</th><th>Rate</th><th>Taxable</th><th>Tax</th></tr>
              </thead>
              <tbody>
                {result.breakdown.filter((b) => b.taxable > 0).map((b, i) => (
                  <tr key={i}>
                    <td>{b.min.toLocaleString()} – {b.max == null ? '∞' : b.max.toLocaleString()}</td>
                    <td>{formatPct(b.rate)}</td>
                    <td>{formatRM(b.taxable)}</td>
                    <td>{formatRM(b.tax)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr><td colSpan="3"><strong>Gross tax</strong></td><td><strong>{formatRM(result.grossTax)}</strong></td></tr>
                <tr><td colSpan="3">PCB paid</td><td>{formatRM(result.pcbPaid)}</td></tr>
                <tr><td colSpan="3"><strong>{result.isRefund ? 'Refund' : 'Balance due'}</strong></td>
                  <td><strong>{formatRM(Math.abs(result.balance))}</strong></td></tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Right: scenario cards stacked */}
        <div className="taxcalc-scenarios">
          <h3 style={{ margin: '0 0 4px', fontWeight: 900, letterSpacing: '-0.01em' }}>Compare scenarios</h3>
          <p className="subtitle" style={{ marginTop: 0 }}>See how different situations affect your tax.</p>
          <div className="grid-auto-wide">
            {scenarios.map((s) => (
              <div className="card" key={s.name}>
                <div className="stat-label" style={{ marginBottom: 10 }}>{s.name}</div>
                <div className="scenario-row"><span>Gross</span><span>{formatRM(s.r.totalGross)}</span></div>
                <div className="scenario-row"><span>Chargeable</span><span>{formatRM(s.r.chargeableIncome)}</span></div>
                <div className="scenario-row"><span>Gross tax</span><span>{formatRM(s.r.grossTax)}</span></div>
                <div className="scenario-row"><span>Eff. rate</span><span>{formatPct(s.r.effectiveRate)}</span></div>
                <div className="scenario-row scenario-balance">
                  <strong style={{ color: s.r.isRefund ? 'var(--positive)' : 'var(--ink)' }}>
                    {s.r.isRefund ? 'Refund' : 'Due'}
                  </strong>
                  <strong style={{ color: s.r.isRefund ? 'var(--positive)' : 'var(--pink)' }}>
                    {formatRM(Math.abs(s.r.balance))}
                  </strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
