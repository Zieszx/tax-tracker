/**
 * SourceCard.jsx — Task 3.1
 *
 * Renders a single IncomeSource as an editable card.
 * Supports type:'main' (monthly gross, months active, name, autoStatutory)
 * and type:'part' (amount per payment, schedule, months active, name).
 *
 * Props:
 *   source   {IncomeSource}
 *   onChange (updatedSource) => void
 *   onRemove () => void
 */

export default function SourceCard({ source, onChange, onRemove }) {
  const update = (field, value) => onChange({ ...source, [field]: value })
  const updateMonths = (edge, value) =>
    onChange({
      ...source,
      monthsActive: { ...source.monthsActive, [edge]: Number(value) || 1 },
    })

  const isMain = source.type === 'main'

  return (
    <div className="card source-card">
      {/* Header row */}
      <div className="source-card-head">
        <span className={`source-badge ${isMain ? 'source-badge-main' : 'source-badge-part'}`}>
          {isMain ? 'Main' : 'Part-time'}
        </span>
        <button
          className="source-remove-btn"
          onClick={onRemove}
          aria-label={`remove source ${source.name}`}
          title="Remove source"
        >
          ✕
        </button>
      </div>

      {/* Name */}
      <label className="field">
        <span>Name</span>
        <input
          type="text"
          aria-label="source name"
          value={source.name || ''}
          onChange={(e) => update('name', e.target.value)}
          placeholder={isMain ? 'e.g. Main employer' : 'e.g. Freelance / Nuvera'}
        />
      </label>

      {isMain ? (
        <>
          {/* Monthly gross */}
          <label className="field">
            <span>Monthly gross (RM)</span>
            <input
              type="number"
              aria-label="monthly gross"
              value={source.monthlyGross ?? ''}
              onChange={(e) =>
                update('monthlyGross', parseFloat(e.target.value) || 0)
              }
              min="0"
              step="100"
            />
          </label>

          {/* autoStatutory */}
          <label className="field source-checkbox-row">
            <input
              type="checkbox"
              aria-label="auto statutory (EPF/SOCSO/EIS)"
              checked={source.autoStatutory ?? true}
              onChange={(e) => update('autoStatutory', e.target.checked)}
            />
            <span>Auto EPF / SOCSO / EIS deductions</span>
          </label>
        </>
      ) : (
        <>
          {/* Amount per payment */}
          <label className="field">
            <span>Amount per payment (RM)</span>
            <input
              type="number"
              aria-label="amount per payment"
              value={source.amountPerPayment ?? ''}
              onChange={(e) =>
                update('amountPerPayment', parseFloat(e.target.value) || 0)
              }
              min="0"
              step="50"
            />
          </label>

          {/* Schedule */}
          <label className="field">
            <span>Schedule</span>
            <select
              aria-label="payment schedule"
              value={source.schedule || '1st & 15th'}
              onChange={(e) => update('schedule', e.target.value)}
            >
              <option value="1st & 15th">1st &amp; 15th (biweekly)</option>
              <option value="monthly">Monthly (1st)</option>
            </select>
          </label>
        </>
      )}

      {/* Months active */}
      <div className="source-months-row">
        <span className="field-label">Active months</span>
        <label className="field source-months-field">
          <span>From</span>
          <select
            aria-label="active from month"
            value={source.monthsActive?.from ?? 1}
            onChange={(e) => updateMonths('from', e.target.value)}
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(2000, i, 1).toLocaleString('default', { month: 'short' })}
              </option>
            ))}
          </select>
        </label>
        <label className="field source-months-field">
          <span>To</span>
          <select
            aria-label="active to month"
            value={source.monthsActive?.to ?? 12}
            onChange={(e) => updateMonths('to', e.target.value)}
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(2000, i, 1).toLocaleString('default', { month: 'short' })}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  )
}
