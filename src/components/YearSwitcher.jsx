/**
 * YearSwitcher.jsx — Task 3.2
 *
 * Dropdown of available assessment years with add-year (blank or clone) flow.
 * Reads allYears / activeYear from useProfile; writes via setActiveYear / addYear.
 */

import { useState } from 'react'
import { useProfile } from '../hooks/useProfile.js'

export default function YearSwitcher() {
  const { allYears, activeYear, setActiveYear, addYear } = useProfile()

  const [showAdd, setShowAdd] = useState(false)
  const [newYear, setNewYear] = useState(() => String((activeYear ?? new Date().getFullYear()) + 1))
  const [busy, setBusy] = useState(false)

  // Sorted list of years for the dropdown
  const sortedYears = [...allYears].sort((a, b) => a - b)

  async function handleSwitch(e) {
    const yr = Number(e.target.value)
    if (yr !== activeYear) {
      await setActiveYear(yr)
    }
  }

  async function handleAddBlank() {
    const yr = Number(newYear)
    if (!yr || yr < 2000 || yr > 2100) return
    setBusy(true)
    try {
      await addYear(yr, 'blank')
      setShowAdd(false)
    } finally {
      setBusy(false)
    }
  }

  async function handleAddClone() {
    const yr = Number(newYear)
    if (!yr || yr < 2000 || yr > 2100) return
    setBusy(true)
    try {
      await addYear(yr, 'clone')
      setShowAdd(false)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="year-switcher">
      {/* Year select */}
      <select
        className="year-select"
        value={String(activeYear ?? '')}
        onChange={handleSwitch}
        aria-label="Switch assessment year"
        disabled={busy}
      >
        {sortedYears.map((yr) => (
          <option key={yr} value={String(yr)}>
            {yr}
          </option>
        ))}
      </select>

      {/* Add year toggle */}
      {!showAdd ? (
        <button
          className="btn btn-ghost year-add-btn"
          onClick={() => setShowAdd(true)}
          aria-label="Add year"
          disabled={busy}
        >
          + Add Year
        </button>
      ) : (
        <div className="year-add-form">
          <label className="year-add-label" htmlFor="year-switcher-new-year">
            New Year
          </label>
          <input
            id="year-switcher-new-year"
            className="year-add-input"
            type="number"
            min="2000"
            max="2100"
            value={newYear}
            onChange={(e) => setNewYear(e.target.value)}
            aria-label="New year"
            disabled={busy}
          />
          <button
            className="btn btn-gold year-add-confirm"
            onClick={handleAddBlank}
            disabled={busy}
            aria-label="Add blank"
          >
            Add Blank
          </button>
          <button
            className="btn btn-ink year-add-confirm"
            onClick={handleAddClone}
            disabled={busy}
            aria-label="Clone current"
          >
            Clone
          </button>
          <button
            className="btn btn-ghost year-add-cancel"
            onClick={() => setShowAdd(false)}
            disabled={busy}
            aria-label="Cancel add year"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}
