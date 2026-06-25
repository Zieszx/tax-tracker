import { useRef } from 'react'
import { useProfile } from '../hooks/useProfile.js'
import { formatRM } from '../engine/format.js'

export default function BorangGuide() {
  const { result, exportJson, importJson, resetToDefault, clearToBlank } = useProfile()
  const fileRef = useRef(null)

  const download = () => {
    const blob = new Blob([exportJson()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'tax-profile-2026.json'; a.click()
    URL.revokeObjectURL(url)
  }
  const onFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try { importJson(String(reader.result)) }
      catch { alert('Invalid profile file.') }
    }
    reader.readAsText(file)
  }

  const steps = [
    { f: 'Bahagian B — Statutory income from employment', v: formatRM(result.totalGross),
      note: 'Include BOTH main salary and part-time (Nuvera) income here.' },
    { f: 'Bahagian C/D — Total reliefs', v: formatRM(result.totalReliefs),
      note: 'Personal RM9,000, lifestyle, life insurance/EPF, SOCSO, etc.' },
    { f: 'Chargeable income', v: formatRM(result.chargeableIncome),
      note: 'Auto-calculated = income − reliefs.' },
    { f: 'Tax charged', v: formatRM(result.grossTax), note: 'Per the resident tax schedule.' },
    { f: 'PCB / MTD already paid', v: formatRM(result.pcbPaid), note: 'From your MyTax ledger.' },
    { f: result.isRefund ? 'Refund due to you' : 'Balance of tax payable',
      v: formatRM(Math.abs(result.balance)),
      note: result.isRefund ? 'Ensure your bank account is updated in MyTax.' : 'Pay via FPX or JomPAY biller 30001.' },
  ]

  return (
    <div>
      <h2 className="page-title">Borang BE e-Filing Guide</h2>
      <p className="subtitle">Map your figures to the BE form. Deadline: <strong>30 April 2027</strong> · mytax.hasil.gov.my</p>

      <div className="card">
        <div className="stat-label">Field-by-field</div>
        <ol className="be-steps">
          {steps.map((s, i) => (
            <li key={i}>
              <div className="be-field"><strong>{s.f}</strong><span>{s.v}</span></div>
              <div className="stat-hint">{s.note}</div>
            </li>
          ))}
        </ol>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="stat-label">Before you file — checklist</div>
        <ul className="be-checklist">
          <li>Keep receipts: WiFi, insurance, phone purchase</li>
          <li>Consider SSPN deposit (up to RM8,000 relief)</li>
          <li>Consider a medical checkup before Dec 2026 (RM1,000 relief)</li>
          <li>Confirm bank account in MyTax profile (for refunds)</li>
        </ul>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="stat-label">Your data</div>
        <div className="data-actions">
          <button className="btn-secondary" onClick={download}>Export JSON</button>
          <button className="btn-secondary" onClick={() => fileRef.current?.click()}>Import JSON</button>
          <input ref={fileRef} type="file" accept="application/json" hidden onChange={onFile} />
          <button className="btn-secondary" onClick={resetToDefault}>Reset to my 2026 data</button>
          <button className="btn-secondary" onClick={clearToBlank}>Clear to blank</button>
        </div>
      </div>
    </div>
  )
}
