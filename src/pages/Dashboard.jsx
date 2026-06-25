import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { useProfile } from '../hooks/useProfile.js'
import StatCard from '../components/StatCard.jsx'
import { formatRM, formatPct } from '../engine/format.js'

export default function Dashboard() {
  const { profile, result } = useProfile()
  const months = profile.income.months
  const tracked = months.filter((m) => m.mainSalary > 0 || m.partTime.length > 0).length
  const chartData = months.map((m) => ({
    name: m.month.slice(5),
    main: m.mainSalary,
    part: m.partTime.reduce((s, p) => s + p.amount, 0),
  }))
  const refund = result.isRefund

  return (
    <div>
      <h2 className="page-title">Dashboard</h2>
      <p className="subtitle">Your 2026 tax at a glance.</p>

      <div className={`card hero ${refund ? 'hero-positive' : ''}`}>
        <div className="stat-label">{refund ? 'Estimated Refund' : 'Estimated Balance Due'}</div>
        <div className="hero-value" style={{ color: refund ? 'var(--positive)' : 'var(--ink)' }}>
          {formatRM(Math.abs(result.balance))}
        </div>
        <div className="stat-hint">{refund ? 'You may get this back' : 'Payable at e-Filing, April 2027'}</div>
      </div>

      <div className="grid grid-3" style={{ marginTop: 16 }}>
        <StatCard label="Total Gross" value={formatRM(result.totalGross)} />
        <StatCard label="Chargeable Income" value={formatRM(result.chargeableIncome)} accent="pink" />
        <StatCard label="PCB Paid" value={formatRM(result.pcbPaid)} accent="positive" />
      </div>
      <div className="grid grid-2" style={{ marginTop: 16 }}>
        <StatCard label="Gross Tax" value={formatRM(result.grossTax)} />
        <StatCard label="Effective Rate" value={formatPct(result.effectiveRate)} accent="pink"
          hint={`${tracked}/12 months tracked — keep it up!`} />
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="stat-label">Monthly income</div>
        <div style={{ width: '100%', height: 260 }}>
          <ResponsiveContainer>
            <BarChart data={chartData}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => formatRM(v)} />
              <Bar dataKey="main" stackId="a" fill="var(--gold)" name="Main" />
              <Bar dataKey="part" stackId="a" fill="var(--pink)" name="Part-time" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
