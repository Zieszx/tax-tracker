export default function StatCard({ label, value, accent = 'gold', hint }) {
  return (
    <div className="card stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={{ color: `var(--${accent})` }}>{value}</div>
      {hint && <div className="stat-hint">{hint}</div>}
    </div>
  )
}
