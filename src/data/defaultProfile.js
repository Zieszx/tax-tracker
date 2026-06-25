import { TAX_BRACKETS } from '../engine/constants.js'

const mainSalaries = [3100, 4500, 4500, 4000, 4500, 4000, 4500, 4500, 4500, 4500, 4500, 4500]

// Jan–Jun confirmed part-time; Jul–Dec projected ~1680 (explicit entries, one per month)
const partTimeByMonth = [
  [{ date: '2026-01-15', amount: 333.33, note: 'Different bank account' }],
  [{ date: '2026-02-15', amount: 2000, note: 'Excludes RM300 personal transfer from Umiii' }],
  [{ date: '2026-03-01', amount: 1000, note: '' }, { date: '2026-03-15', amount: 1110.80, note: '' }],
  [{ date: '2026-04-01', amount: 1000, note: '' }, { date: '2026-04-15', amount: 1000, note: '' }],
  [{ date: '2026-05-01', amount: 1000, note: '' }, { date: '2026-05-15', amount: 1000, note: '' }],
  [{ date: '2026-06-01', amount: 1638.11, note: 'One payment confirmed' }],
  [{ date: '2026-07-01', amount: 1680, note: 'Projected' }],
  [{ date: '2026-08-01', amount: 1680, note: 'Projected' }],
  [{ date: '2026-09-01', amount: 1680, note: 'Projected' }],
  [{ date: '2026-10-01', amount: 1680, note: 'Projected' }],
  [{ date: '2026-11-01', amount: 1680, note: 'Projected' }],
  [{ date: '2026-12-01', amount: 1680, note: 'Projected' }],
]

const monthNames = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']

export const defaultProfile = {
  settings: {
    taxYear: 2026,
    residentStatus: 'resident',
    maritalStatus: 'single',
    theme: 'system',
    taxBrackets: TAX_BRACKETS,
  },
  income: {
    months: monthNames.map((mm, i) => ({
      month: `2026-${mm}`,
      mainSalary: mainSalaries[i],
      partTime: partTimeByMonth[i] || [],
    })),
  },
  pcbPaid: [
    { month: '2026-01', amount: 0, ref: '' },
    { month: '2026-02', amount: 79.35, ref: '20-EM2600402490' },
    { month: '2026-03', amount: 79.20, ref: '20-EM2600592304' },
    { month: '2026-04', amount: 0, ref: '' },
    { month: '2026-05', amount: 468.90, ref: '20-EM2601013855 (catch-up)' },
  ],
  reliefs: [
    { key: 'personal', label: 'Personal relief', amount: 9000, limit: 9000, auto: true },
    { key: 'epf_life', label: 'EPF + Life insurance', amount: 360, limit: 7000 },
    { key: 'lifestyle', label: 'Lifestyle (WiFi, phone, etc.)', amount: 2500, limit: 2500 },
    { key: 'socso', label: 'SOCSO/EIS contribution', amount: 237, limit: 350 },
    { key: 'sspn', label: 'SSPN net deposit', amount: 0, limit: 8000 },
    { key: 'medical', label: 'Medical checkup', amount: 0, limit: 1000 },
  ],
}

export const RELIEF_TEMPLATE = defaultProfile.reliefs.map((r) => ({ ...r, amount: r.auto ? r.amount : 0 }))

export const blankProfile = {
  settings: {
    taxYear: 2026,
    residentStatus: 'resident',
    maritalStatus: 'single',
    theme: 'system',
    taxBrackets: TAX_BRACKETS,
  },
  income: {
    months: monthNames.map((mm) => ({ month: `2026-${mm}`, mainSalary: 0, partTime: [] })),
  },
  pcbPaid: [],
  reliefs: RELIEF_TEMPLATE.map((r) => ({ ...r })),
}
