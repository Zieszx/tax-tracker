export const EPF_RATE = 0.11
export const SOCSO_RATE = 0.005
export const SOCSO_CAP = 19.75      // RM/month for salary band > 4000
export const EIS_RATE = 0.002
export const EIS_SALARY_CAP = 4000  // EIS charged on first RM4000 of salary

// Resident individual progressive brackets (assumed YA2026 schedule, editable).
// max:null means "and above".
export const TAX_BRACKETS = [
  { min: 0,       max: 5000,    rate: 0.00 },
  { min: 5000,    max: 20000,   rate: 0.01 },
  { min: 20000,   max: 35000,   rate: 0.03 },
  { min: 35000,   max: 50000,   rate: 0.06 },
  { min: 50000,   max: 70000,   rate: 0.11 },
  { min: 70000,   max: 100000,  rate: 0.19 },
  { min: 100000,  max: 400000,  rate: 0.25 },
  { min: 400000,  max: 600000,  rate: 0.26 },
  { min: 600000,  max: 2000000, rate: 0.28 },
  { min: 2000000, max: null,    rate: 0.30 },
]
