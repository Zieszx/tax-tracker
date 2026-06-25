/**
 * ImportCsvModal.jsx — Task 4.2
 *
 * Modal for importing bank CSV files.
 * Parses the uploaded CSV, shows a preview table with checkboxes,
 * then merges selected credit rows as part-time monthOverrides via setYear.
 *
 * Usage:
 *   <ImportCsvModal open={open} onClose={() => setOpen(false)} setYear={setYear} year={year} />
 */

import { useState, useRef } from 'react'
import { parseBankCsv, creditsToPartTime } from '../data/csvImport.js'
import { formatRM } from '../engine/format.js'

export default function ImportCsvModal({ open, onClose, setYear, year }) {
  const [rows, setRows] = useState([]) // parsed credit rows from CSV
  const [entries, setEntries] = useState([]) // creditsToPartTime output
  const [selected, setSelected] = useState({}) // idx → bool
  const [error, setError] = useState('')
  const [importing, setImporting] = useState(false)
  const [done, setDone] = useState(false)
  const fileInputRef = useRef(null)

  const taxYear = year?.taxYear ?? 2026

  if (!open) return null

  function reset() {
    setRows([])
    setEntries([])
    setSelected({})
    setError('')
    setDone(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function handleClose() {
    reset()
    onClose()
  }

  function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return

    setError('')
    setDone(false)

    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const text = ev.target.result
        const { rows: creditRows } = parseBankCsv(text)
        const mapped = creditsToPartTime(creditRows, taxYear)

        if (mapped.length === 0) {
          setError(
            `No credit rows found for year ${taxYear}. Check that the file contains transactions for this year.`
          )
          setRows([])
          setEntries([])
          setSelected({})
          return
        }

        setRows(creditRows)
        setEntries(mapped)
        // Pre-select all rows
        const sel = {}
        mapped.forEach((_, i) => { sel[i] = true })
        setSelected(sel)
      } catch (err) {
        setError('Could not parse file: ' + (err?.message ?? 'unknown error'))
      }
    }
    reader.onerror = () => setError('Failed to read file.')
    reader.readAsText(file)
  }

  function toggleAll(checked) {
    const sel = {}
    entries.forEach((_, i) => { sel[i] = checked })
    setSelected(sel)
  }

  function toggleRow(i) {
    setSelected((prev) => ({ ...prev, [i]: !prev[i] }))
  }

  async function handleImport() {
    const selectedEntries = entries.filter((_, i) => selected[i])
    if (selectedEntries.length === 0) {
      setError('Select at least one row to import.')
      return
    }

    setImporting(true)
    setError('')

    try {
      await setYear((yr) => {
        const nextOverrides = { ...(yr.monthOverrides ?? {}) }

        for (const { month, entry } of selectedEntries) {
          const existing = nextOverrides[month]
          // Merge: append to existing partTime array (don't replace)
          const existingPartTime = existing?.partTime ?? []
          nextOverrides[month] = {
            ...existing,
            // Preserve mainSalary if present
            mainSalary: existing?.mainSalary,
            partTime: [...existingPartTime, { ...entry }],
          }
          // Clean up undefined mainSalary
          if (nextOverrides[month].mainSalary === undefined) {
            delete nextOverrides[month].mainSalary
          }
        }

        return { ...yr, monthOverrides: nextOverrides }
      })

      setDone(true)
    } catch (err) {
      setError('Import failed: ' + (err?.message ?? 'unknown error'))
    } finally {
      setImporting(false)
    }
  }

  const allChecked =
    entries.length > 0 && entries.every((_, i) => selected[i])
  const someChecked = entries.some((_, i) => selected[i])
  const selectedCount = entries.filter((_, i) => selected[i]).length

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Import bank CSV"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}
    >
      <div className="modal-panel">
        {/* Header */}
        <div className="modal-header">
          <h3 className="modal-title">Import Bank CSV</h3>
          <button
            className="modal-close-btn"
            aria-label="Close import modal"
            onClick={handleClose}
          >
            ✕
          </button>
        </div>

        <p className="modal-desc">
          Upload a bank statement CSV (Bank Islam-compatible: Date, Description, Debit,
          Credit, Balance). Credit rows will be added as part-time income entries for{' '}
          <strong>{taxYear}</strong>.
        </p>

        {/* File input */}
        <div className="modal-file-row">
          <label htmlFor="csv-file-input" className="btn btn-gold">
            Choose CSV file
          </label>
          <input
            id="csv-file-input"
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleFile}
            aria-label="CSV file input"
            style={{ position: 'absolute', opacity: 0, width: 1, height: 1 }}
          />
          {rows.length > 0 && (
            <span className="modal-file-info">
              {entries.length} credit row{entries.length !== 1 ? 's' : ''} found
            </span>
          )}
        </div>

        {error && (
          <p className="modal-error" role="alert">
            {error}
          </p>
        )}

        {done && (
          <p className="modal-success" role="status">
            {selectedCount} entr{selectedCount !== 1 ? 'ies' : 'y'} imported successfully.
          </p>
        )}

        {/* Preview table */}
        {entries.length > 0 && !done && (
          <>
            <div className="modal-table-wrapper">
              <table className="csv-preview-table" aria-label="CSV preview">
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        checked={allChecked}
                        ref={(el) => { if (el) el.indeterminate = someChecked && !allChecked }}
                        onChange={(e) => toggleAll(e.target.checked)}
                        aria-label="Select all rows"
                      />
                    </th>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Month</th>
                    <th>Amount (RM)</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map(({ month, entry }, i) => (
                    <tr
                      key={i}
                      className={selected[i] ? 'csv-row-selected' : ''}
                      onClick={() => toggleRow(i)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={!!selected[i]}
                          onChange={() => toggleRow(i)}
                          aria-label={`select row ${i + 1}`}
                        />
                      </td>
                      <td>{entry.date}</td>
                      <td className="csv-desc">{entry.note}</td>
                      <td>{month}</td>
                      <td className="csv-amount">{formatRM(entry.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="modal-actions">
              <span className="modal-selected-count">
                {selectedCount} of {entries.length} selected
              </span>
              <button
                className="btn btn-ghost"
                onClick={handleClose}
                disabled={importing}
              >
                Cancel
              </button>
              <button
                className="btn btn-gold"
                onClick={handleImport}
                disabled={importing || selectedCount === 0}
                aria-label={`Import ${selectedCount} selected rows`}
              >
                {importing ? 'Importing…' : `Import ${selectedCount} row${selectedCount !== 1 ? 's' : ''}`}
              </button>
            </div>
          </>
        )}

        {entries.length === 0 && !error && rows.length === 0 && (
          <div className="modal-empty-hint">
            <p>No file loaded yet. Choose a CSV file above to preview its credit transactions.</p>
          </div>
        )}

        {done && (
          <div className="modal-actions">
            <button className="btn btn-gold" onClick={handleClose}>
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
