/**
 * BorangGuide.jsx — Task 4.4: Expanded Borang BE e-Filing Guide
 *
 * Sections:
 *   1. Before you start (who files, registration, documents to prepare)
 *   2. Step-by-step e-Filing (Bahagian A–H with live result.* figures)
 *   3. Payment (FPX / JomPAY)
 *   4. Special notes (Umiii RM300 non-taxable, part-time as employment income)
 *   5. Deadlines & penalties
 *   6. After filing (check status + refund)
 *   7. Before-you-file checklist
 *
 * Data-management (export/import/reset) lives in Settings — link provided.
 */

import { Link } from 'react-router-dom'
import { useProfile } from '../hooks/useProfile.js'
import { formatRM } from '../engine/format.js'

export default function BorangGuide() {
  const profile = useProfile()
  const result  = profile?.result

  // ── live figures (fall back gracefully if not yet computed) ──────────────
  const totalGross       = result ? formatRM(result.totalGross)       : '—'
  const totalReliefs     = result ? formatRM(result.totalReliefs)     : '—'
  const chargeableIncome = result ? formatRM(result.chargeableIncome) : '—'
  const grossTax         = result ? formatRM(result.grossTax)         : '—'
  const pcbPaid          = result ? formatRM(result.pcbPaid)          : '—'
  const balanceLabel     = result?.isRefund ? 'Refund due to you'     : 'Balance of tax payable'
  const balanceValue     = result ? formatRM(Math.abs(result.balance)) : '—'

  return (
    <div>
      <h2 className="page-title">Borang BE e-Filing Guide</h2>
      <p className="subtitle guide-prose">
        Step-by-step guide for resident individuals without business income.
        Deadline: <strong>30 April 2027</strong> ·{' '}
        <a href="https://mytax.hasil.gov.my" target="_blank" rel="noopener noreferrer">
          mytax.hasil.gov.my
        </a>
      </p>

      {/* ── Section 1: Before you start ──────────────────────────────────── */}
      <section className="card guide-prose" aria-labelledby="bys-heading">
        <h3 className="settings-heading" id="bys-heading">Before you start</h3>

        <h4 className="be-subheading">Who files Borang BE?</h4>
        <p className="be-body">
          Borang BE is for <strong>resident individuals</strong> whose income comes entirely
          from employment (salaries, wages, allowances, part-time payments). If you have
          business income, use Borang B instead.
        </p>

        <h4 className="be-subheading">Registration / first-time filers</h4>
        <ol className="be-list">
          <li>
            Visit <strong>mytax.hasil.gov.my</strong> → <em>First-time Login</em>.
          </li>
          <li>
            Request a <strong>PIN number</strong> online (or visit the nearest LHDN office).
            You will need your MyKad and a valid email address.
          </li>
          <li>
            Activate your e-Filing account and set a password before the filing deadline.
          </li>
        </ol>

        <h4 className="be-subheading">Documents to prepare</h4>
        <ul className="be-checklist">
          <li>
            <strong>EA form</strong> — from your main employer, confirming gross salary and
            PCB/MTD deducted for YA 2026.
          </li>
          <li>
            <strong>Part-time payment records</strong> — bank statements, invoices, or
            receipts showing all part-time / freelance / additional income received.
          </li>
          <li>
            <strong>Relief receipts</strong> — receipts / e-receipts for lifestyle purchases
            (books, sports, electronics), medical costs, insurance premiums, SSPN statements, etc.
          </li>
          <li>
            <strong>PCB ledger from MyTax</strong> — log in to MyTax and verify the total MTD
            contributions match your EA form.
          </li>
          <li>
            <strong>EPF statement</strong> — for self-contribution relief (if applicable).
          </li>
          <li>
            <strong>Bank account details</strong> — in case of a refund; confirm it is
            updated in your MyTax profile.
          </li>
        </ul>
      </section>

      {/* ── Sections 2 + 7: field-mapping + checklist side-by-side ─────────── */}
      <div className="guide-split" style={{ marginTop: 16 }}>

      {/* ── Section 2: Step-by-step e-Filing ─────────────────────────────── */}
      <section className="card" aria-labelledby="steps-heading">
        <h3 className="settings-heading" id="steps-heading">Step-by-step e-Filing</h3>

        <ol className="be-steps">
          <li>
            <div className="be-step-title">Log in to mytax.hasil.gov.my</div>
            <p className="be-body">
              Go to <em>e-Filing → e-Borang</em> and select <strong>Borang BE YA 2026</strong>.
            </p>
          </li>

          <li>
            <div className="be-step-title">Bahagian A — Personal particulars</div>
            <p className="be-body">
              Verify your MyKad number, address, marital status, and bank account number.
              A correct bank account is essential if you are owed a refund.
            </p>
          </li>

          <li>
            <div className="be-step-title">Bahagian B — Statutory income from employment</div>
            <div className="be-field-row">
              <span className="be-field-label">Your total gross employment income</span>
              <span className="be-field-value">{totalGross}</span>
            </div>
            <p className="be-body">
              Enter <strong>all</strong> employment income here — your main salary AND any
              part-time or supplementary payments (e.g. Nuvera). Both are classified as
              employment income under Section 13, Income Tax Act 1967.
            </p>
            <p className="be-note">
              Note: the RM300 "Umiii" personal transfer from family is <strong>not income</strong> —
              do <em>not</em> declare it here (see Special Notes below).
            </p>
          </li>

          <li>
            <div className="be-step-title">Bahagian C &amp; D — Statutory income from other sources</div>
            <p className="be-body">
              If you have rental income, interest, or royalties, declare them here.
              For most salaried employees these fields will be zero.
            </p>
          </li>

          <li>
            <div className="be-step-title">Bahagian E — Aggregate income &amp; total income</div>
            <p className="be-body">
              The e-Filing system auto-calculates this from Bahagian B–D.
              Verify it matches your expected total gross figure.
            </p>
          </li>

          <li>
            <div className="be-step-title">Bahagian F — Approved donations &amp; gifts</div>
            <p className="be-body">
              Enter any cash donations to approved institutions (Gift Aid / zakat fitrah /
              government-approved charities). Keep official receipts.
            </p>
          </li>

          <li>
            <div className="be-step-title">Bahagian G — Personal reliefs &amp; rebates</div>
            <div className="be-field-row">
              <span className="be-field-label">Your total reliefs</span>
              <span className="be-field-value">{totalReliefs}</span>
            </div>
            <p className="be-body">Enter each relief individually:</p>
            <ul className="be-list">
              <li><strong>Personal relief</strong> — RM 9,000 (automatic)</li>
              <li><strong>EPF / life insurance</strong> — up to RM 7,000 (self)</li>
              <li><strong>Lifestyle</strong> — up to RM 2,500 (books, internet, sports, etc.)</li>
              <li><strong>Medical / dental</strong> — up to RM 10,000 (self / spouse / child)</li>
              <li><strong>SSPN net deposit</strong> — up to RM 8,000</li>
              <li><strong>SOCSO / EIS</strong> — actual amount deducted</li>
              <li><strong>Education fees</strong> — up to RM 7,000 (self; diploma and above)</li>
              <li><strong>Medical checkup</strong> — up to RM 1,000 (included in medical limit)</li>
            </ul>
          </li>

          <li>
            <div className="be-step-title">Chargeable income &amp; tax charged</div>
            <div className="be-field-row">
              <span className="be-field-label">Chargeable income</span>
              <span className="be-field-value">{chargeableIncome}</span>
            </div>
            <div className="be-field-row">
              <span className="be-field-label">Gross tax charged</span>
              <span className="be-field-value">{grossTax}</span>
            </div>
            <p className="be-body">
              The system computes this automatically: chargeable income = total income − reliefs.
              Tax is applied to chargeable income per the resident progressive tax schedule.
            </p>
          </li>

          <li>
            <div className="be-step-title">Bahagian H — PCB / MTD already paid</div>
            <div className="be-field-row">
              <span className="be-field-label">PCB / MTD paid (from EA form)</span>
              <span className="be-field-value">{pcbPaid}</span>
            </div>
            <p className="be-body">
              Enter the total Monthly Tax Deduction (MTD / PCB) as shown on your EA form(s).
              Cross-check with your MyTax PCB ledger.
            </p>
          </li>

          <li>
            <div className="be-step-title">Final result — {balanceLabel}</div>
            <div className="be-field-row be-field-highlight">
              <span className="be-field-label">{balanceLabel}</span>
              <span className="be-field-value">{balanceValue}</span>
            </div>
            <p className="be-body">
              {result?.isRefund
                ? 'You are owed a refund. Ensure your bank account in MyTax is correct — LHDN will transfer the refund within 30 working days of submission.'
                : 'You have a balance to pay. Settle it before 30 April 2027 to avoid late-payment penalties. See the Payment section below.'}
            </p>
          </li>

          <li>
            <div className="be-step-title">Submit Borang BE</div>
            <p className="be-body">
              Review all entries, then click <strong>Hantar / Submit</strong>. Save or print the
              acknowledgement slip (PDF) as proof of submission.
            </p>
          </li>
        </ol>
      </section>

      {/* ── Section 7: Before-you-file checklist (right col in guide-split) ── */}
      <section className="card" aria-labelledby="checklist-heading">
        <h3 className="settings-heading" id="checklist-heading">Before-you-file checklist</h3>
        <ul className="be-checklist">
          <li>EA form(s) received and verified against MyTax PCB ledger</li>
          <li>Part-time payment records collated for all months</li>
          <li>Lifestyle relief receipts gathered (WiFi, books, sports equipment, electronics)</li>
          <li>Medical / dental receipts collected</li>
          <li>Insurance premium certificate obtained from insurer</li>
          <li>SSPN net deposit confirmed (consider topping up before 31 Dec 2026 — up to RM8,000 relief)</li>
          <li>Consider a medical checkup before 31 Dec 2026 (up to RM1,000 relief within the medical limit)</li>
          <li>Bank account in MyTax profile is up-to-date (essential for refunds)</li>
          <li>MyTax e-Filing password is active and accessible</li>
        </ul>
      </section>

      </div>{/* end guide-split */}

      {/* ── Section 3: Payment ───────────────────────────────────────────── */}
      <section className="card guide-prose" style={{ marginTop: 16 }} aria-labelledby="payment-heading">
        <h3 className="settings-heading" id="payment-heading">Payment</h3>

        <p className="be-body">
          If you have a balance to pay, you must pay <strong>by 30 April 2027</strong> to avoid
          late-payment surcharges.
        </p>

        <h4 className="be-subheading">Online banking — FPX</h4>
        <p className="be-body">
          Log in to MyTax → <em>e-Bayaran</em> → select <strong>FPX</strong> → choose your bank
          (e.g. Maybank2U, CIMB Clicks, RHB Now) → confirm the payment reference and amount.
        </p>

        <h4 className="be-subheading">JomPAY</h4>
        <p className="be-body">
          Available via your bank's mobile app or internet banking under the JomPAY service.
          Use <strong>Biller Code 30001</strong> (LHDN). Your IC number is the reference number.
        </p>

        <h4 className="be-subheading">Counter / cheque</h4>
        <p className="be-body">
          You may also pay in person at any LHDN branch or post office (Pos Malaysia).
          Make cheques payable to <em>Ketua Pengarah Hasil Dalam Negeri</em>.
        </p>
      </section>

      {/* ── Section 4: Special notes ─────────────────────────────────────── */}
      <section className="card guide-prose" style={{ marginTop: 16 }} aria-labelledby="notes-heading">
        <h3 className="settings-heading" id="notes-heading">Special notes</h3>

        <div className="be-note-card">
          <strong>RM300 "Umiii" personal transfer — not taxable</strong>
          <p className="be-body">
            A personal money transfer from a family member (e.g. a parent's monthly RM300 to
            you, nicknamed "Umiii") is a <strong>gift / personal transfer</strong>, not income.
            It is <strong>not taxable</strong> under Malaysian income tax law and should
            <em> not</em> be declared in Borang BE. There is no withholding or reporting
            requirement for gifts between individuals in Malaysia.
          </p>
        </div>

        <div className="be-note-card" style={{ marginTop: 12 }}>
          <strong>Part-time / supplementary income</strong>
          <p className="be-body">
            Part-time employment payments (e.g. from a second employer, part-time gig, or
            scheduled side work) are classified as <strong>employment income</strong> under
            Section 13, ITA 1967. Declare them in <strong>Bahagian B</strong> together with
            your main salary — not as business income.
          </p>
        </div>
      </section>

      {/* ── Section 5: Deadlines & penalties ────────────────────────────── */}
      <section className="card guide-prose" style={{ marginTop: 16 }} aria-labelledby="deadlines-heading">
        <h3 className="settings-heading" id="deadlines-heading">Deadlines &amp; penalties</h3>

        <table className="be-table" aria-label="Filing deadlines">
          <thead>
            <tr>
              <th>Event</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Filing deadline (e-Filing, no extension)</td>
              <td><strong>30 April 2027</strong></td>
            </tr>
            <tr>
              <td>Paper filing deadline (if applicable)</td>
              <td>30 April 2027</td>
            </tr>
            <tr>
              <td>Balance of tax payment due</td>
              <td><strong>30 April 2027</strong></td>
            </tr>
          </tbody>
        </table>

        <h4 className="be-subheading" style={{ marginTop: 16 }}>Late filing penalties</h4>
        <ul className="be-list">
          <li>
            <strong>Late submission (no reasonable excuse):</strong> a fine of RM200–RM2,000
            and/or imprisonment up to 6 months under Section 112, ITA 1967.
          </li>
          <li>
            <strong>Understatement / omission:</strong> a penalty of 45% of tax undercharged
            (Section 113) may be imposed upon audit or investigation.
          </li>
        </ul>

        <h4 className="be-subheading">Late payment surcharge</h4>
        <ul className="be-list">
          <li>
            If the balance is not paid by 30 April 2027, a <strong>10% surcharge</strong> is
            added on the unpaid amount (Section 103).
          </li>
          <li>
            An additional <strong>5% surcharge</strong> applies if the balance remains unpaid
            60 days after the first surcharge.
          </li>
        </ul>
      </section>

      {/* ── Section 6: After filing ──────────────────────────────────────── */}
      <section className="card guide-prose" style={{ marginTop: 16 }} aria-labelledby="after-heading">
        <h3 className="settings-heading" id="after-heading">After filing</h3>

        <h4 className="be-subheading">Check submission status</h4>
        <p className="be-body">
          Log in to MyTax → <em>e-Filing</em> → <em>Status Penghantaran</em> to confirm your
          submission was received. You should see a reference number and a green "Berjaya" status.
        </p>

        <h4 className="be-subheading">Check refund status</h4>
        <p className="be-body">
          If you are owed a refund, go to MyTax → <em>e-Lejar</em> → <em>Semakan Bayaran
          Balik</em>. LHDN targets processing refunds within <strong>30 working days</strong> for
          e-Filing submissions. Ensure your bank account details in MyTax are correct before filing.
        </p>

        <h4 className="be-subheading">Keep your records</h4>
        <p className="be-body">
          Retain all supporting documents (EA form, receipts, bank statements) for at least
          <strong> 7 years</strong> in case of an audit or review.
        </p>
      </section>

      {/* ── Link to Settings for data management ───────────────────────── */}
      <div className="card be-settings-link" style={{ marginTop: 16 }}>
        <p className="be-body">
          Need to export a backup, import data, or reset the app?{' '}
          <Link to="/settings" className="be-link">
            Go to Settings →
          </Link>
        </p>
      </div>
    </div>
  )
}
