/**
 * MonthsSummary.jsx — Task B4
 *
 * Summary bar + compact 12-month stacked bar chart for the Months tab.
 *
 * Consumes useProfile() and derives:
 *   - annualGross  = sum of all 12 materialized months
 *   - actualCount  = number of confirmed months
 *   - estTax       = result.grossTax (from computeTax)
 *   - A compact Recharts stacked bar chart (gold main / pink part-time)
 *
 * Rendering is purely display — no writes.
 */

import { useProfile } from '../hooks/useProfile.js'
import { materializeMonths } from '../state/materialize.js'
import { formatRM } from '../engine/format.js'
import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

const SHORT_MONTHS = ['J','F','M','A','M','J','J','A','S','O','N','D']

function buildChartData(months) {
  return months.map((m, i) => {
    const partTotal = (m.partTime ?? []).reduce((s, p) => s + (p.amount || 0), 0)
    return {
      name: SHORT_MONTHS[i],
      main: m.mainSalary,
      part: partTotal,
    }
  })
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const main = payload.find((p) => p.dataKey === 'main')?.value ?? 0
  const part = payload.find((p) => p.dataKey === 'part')?.value ?? 0
  return (
    <div className="months-chart-tooltip">
      <div className="months-chart-tooltip-label">{label}</div>
      <div className="months-chart-tooltip-row">
        <span className="months-chart-dot months-chart-dot-main" />
        <span>Main: {formatRM(main)}</span>
      </div>
      {part > 0 && (
        <div className="months-chart-tooltip-row">
          <span className="months-chart-dot months-chart-dot-part" />
          <span>Part: {formatRM(part)}</span>
        </div>
      )}
    </div>
  )
}

export default function MonthsSummary() {
  const ctx = useProfile()
  if (!ctx) return null

  const { year, result } = ctx
  const sources = year?.incomeSources ?? []
  const overrides = year?.monthOverrides ?? {}
  const taxYear = year?.taxYear ?? 2026

  const months = materializeMonths(sources, overrides, taxYear)

  const annualGross = months.reduce(
    (sum, m) => sum + m.mainSalary + (m.partTime ?? []).reduce((s, p) => s + (p.amount || 0), 0),
    0
  )

  const actualCount = Object.values(overrides).filter((ov) => ov?.confirmed === true).length

  const estTax = result?.grossTax ?? 0
  const chartData = buildChartData(months)

  return (
    <div className="months-summary" aria-label="months summary">
      {/* ── Stat pills ───────────────────────────────────────────────────────── */}
      <div className="months-summary-stats">
        <div className="months-summary-stat">
          <span className="stat-label">Annual gross</span>
          <span className="stat-value income-annual-value months-summary-gross" aria-label="annual gross">
            {formatRM(annualGross)}
          </span>
        </div>

        <div className="months-summary-stat">
          <span className="stat-label">Actual months</span>
          <span className="stat-value months-summary-actuals" aria-label="actual months count">
            <span className="months-summary-actuals-n">{actualCount}</span>
            <span className="months-summary-actuals-sep">/</span>
            <span className="months-summary-actuals-denom">12</span>
          </span>
        </div>

        <div className="months-summary-stat">
          <span className="stat-label">Est. income tax</span>
          <span className="stat-value months-summary-tax" aria-label="estimated tax">
            {formatRM(estTax)}
          </span>
        </div>
      </div>

      {/* ── Mini chart ──────────────────────────────────────────────────────── */}
      <div className="months-summary-chart" aria-label="income chart">
        <ResponsiveContainer width="100%" height={80}>
          <BarChart data={chartData} barCategoryGap="20%" margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
            <XAxis
              dataKey="name"
              tick={{ fontSize: 9, fill: 'var(--muted)', fontWeight: 700 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(202,165,58,0.08)' }} />
            <Bar dataKey="main" stackId="a" fill="var(--gold)" radius={[0, 0, 0, 0]} />
            <Bar dataKey="part" stackId="a" fill="var(--pink)" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
