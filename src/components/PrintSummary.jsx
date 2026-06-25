/**
 * PrintSummary.jsx — Task 4.3
 *
 * A one-page identity-free tax summary, visible only when printing.
 * Hidden on screen via the `print-only` class (see src/styles/print.css).
 *
 * Figures shown (no personal identifiers):
 *   - Bahagian B — Gross income (totalGross)
 *   - Total reliefs (totalReliefs)
 *   - Chargeable income
 *   - Tax charged (grossTax)
 *   - PCB / MTD paid
 *   - Balance payable / Refund
 *
 * Also lists the corresponding BE form field names so it doubles as a
 * filing reference sheet.
 */

import { useProfile } from '../hooks/useProfile.js'
import { formatRM } from '../engine/format.js'

// BE form field mapping — label, result key, note
const BE_FIELDS = [
  {
    label: 'Bahagian B — Statutory income from employment',
    key: 'totalGross',
    note: 'Include main salary and all part-time income.',
  },
  {
    label: 'Total reliefs claimed',
    key: 'totalReliefs',
    note: 'Personal RM9,000 + lifestyle, insurance/EPF, SOCSO, etc.',
  },
  {
    label: 'Chargeable income',
    key: 'chargeableIncome',
    note: 'Gross income minus total reliefs.',
  },
  {
    label: 'Tax charged',
    key: 'grossTax',
    note: 'Per the resident progressive tax schedule.',
  },
  {
    label: 'PCB / MTD paid',
    key: 'pcbPaid',
    note: 'Monthly deductions paid to LHDN via employer.',
  },
]

export default function PrintSummary() {
  const profileCtx = useProfile()

  // If vault is locked / profile unavailable, render nothing (still in DOM for
  // the .print-only wrapper to be detectable by the test).
  const result = profileCtx?.result
  const activeYear = profileCtx?.activeYear ?? '—'

  const balanceLabel = result?.isRefund ? 'Refund due to you' : 'Balance of tax payable'
  const balanceValue = result ? Math.abs(result.balance) : 0

  return (
    <div className="print-only" aria-hidden="true">
      <div className="print-summary">
        <h1 className="print-title">Tax Summary — Malaysia Borang BE</h1>
        <p className="print-subtitle">
          Assessment Year {activeYear} · Generated {new Date().toLocaleDateString('en-MY')}
        </p>
        <p className="print-subtitle" style={{ fontStyle: 'italic' }}>
          This document contains no personal identifiers. Keep it secure.
        </p>

        <table className="print-table">
          <thead>
            <tr>
              <th>BE Form Field</th>
              <th>Amount</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {BE_FIELDS.map((f) => (
              <tr key={f.key}>
                <td>{f.label}</td>
                <td className="print-amount">
                  {result ? formatRM(result[f.key] ?? 0) : '—'}
                </td>
                <td className="print-note">{f.note}</td>
              </tr>
            ))}
            <tr className="print-row-balance">
              <td>{balanceLabel}</td>
              <td className="print-amount">{result ? formatRM(balanceValue) : '—'}</td>
              <td className="print-note">
                {result?.isRefund
                  ? 'Ensure your bank account is updated in MyTax.'
                  : 'Pay via FPX or JomPAY biller 30001 by 30 April 2027.'}
              </td>
            </tr>
          </tbody>
        </table>

        <div className="print-footer">
          <p>
            File at <strong>mytax.hasil.gov.my</strong> · Deadline{' '}
            <strong>30 April 2027</strong>
          </p>
          <p>Forgot passcode = all data is lost (no recovery without backup).</p>
        </div>
      </div>
    </div>
  )
}
