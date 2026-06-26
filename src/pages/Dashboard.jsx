import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { useProfile } from '../hooks/useProfile.js'
import StatCard from '../components/StatCard.jsx'
import SavingsCard from '../components/SavingsCard.jsx'
import { formatRM, formatPct } from '../engine/format.js'

export default function Dashboard() {
  const { profile, result, activeYear, year } = useProfile()
  const months = profile.income.months
  const actualCount = Object.values(year?.monthOverrides ?? {}).filter((o) => o?.confirmed).length
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
      <p className="subtitle">Your {activeYear} tax at a glance.</p>

      <div className={`card hero ${refund ? 'hero-positive' : ''}`}>
        <div className="stat-label">{refund ? 'Estimated Refund' : 'Estimated Balance Due'}</div>
        <div className="hero-value">
          {formatRM(Math.abs(result.balance))}
        </div>
        <div className="stat-hint">{refund ? 'You may get this back' : 'Payable at e-Filing, April 2027'}</div>
        <div className="actual-indicator">
          📅 <strong>{actualCount}</strong> of 12 months actual · {12 - actualCount} projected
        </div>
      </div>

      <div className="grid-auto" style={{ marginTop: 16 }}>
        <StatCard label="Total Gross" value={formatRM(result.totalGross)} />
        <StatCard label="Chargeable Income" value={formatRM(result.chargeableIncome)} accent="pink" />
        <StatCard label="PCB Paid" value={formatRM(result.pcbPaid)} accent="positive" />
        <StatCard label="Gross Tax" value={formatRM(result.grossTax)} />
        <StatCard label="Effective Rate" value={formatPct(result.effectiveRate)} accent="pink"
          hint={`${tracked}/12 months tracked — keep it up!`} />
      </div>

      <div className="split-2" style={{ marginTop: 16 }}>
        <div className="card">
          <div className="stat-label">Monthly income</div>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--muted)' }} axisLine={{ stroke: 'var(--border)' }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--muted)' }} axisLine={false} tickLine={false} width={48} />
                <Tooltip
                  formatter={(v) => formatRM(v)}
                  contentStyle={{ background: 'var(--surface)', border: '2px solid var(--border)', borderRadius: 10, fontSize: 13 }}
                  labelStyle={{ color: 'var(--muted)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase' }}
                />
                <Bar dataKey="main" stackId="a" fill="var(--gold)" name="Main" radius={[0, 0, 0, 0]} />
                <Bar dataKey="part" stackId="a" fill="var(--pink)" name="Part-time" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <SavingsCard />
      </div>
    </div>
  )
}
