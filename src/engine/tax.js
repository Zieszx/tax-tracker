import { TAX_BRACKETS } from './constants.js'

export function calcGrossTax(chargeableIncome, brackets = TAX_BRACKETS) {
  const income = Math.max(0, chargeableIncome)
  let total = 0
  const breakdown = brackets.map((b) => {
    const upper = b.max == null ? Infinity : b.max
    const taxable = Math.max(0, Math.min(income, upper) - b.min)
    const tax = taxable * b.rate
    total += tax
    return { min: b.min, max: b.max, rate: b.rate, taxable, tax }
  })
  return { total, breakdown }
}

export function sumIncome(months = []) {
  let totalMain = 0
  let totalPartTime = 0
  for (const m of months) {
    totalMain += m.mainSalary || 0
    for (const p of m.partTime || []) totalPartTime += p.amount || 0
  }
  return { totalMain, totalPartTime, totalGross: totalMain + totalPartTime }
}

export function sumReliefs(reliefs = []) {
  return reliefs.reduce((sum, r) => {
    const capped = r.limit != null ? Math.min(r.amount || 0, r.limit) : (r.amount || 0)
    return sum + capped
  }, 0)
}

export function sumPcb(pcbPaid = []) {
  return pcbPaid.reduce((sum, p) => sum + (p.amount || 0), 0)
}

export function computeTax(profile) {
  const brackets = profile?.settings?.taxBrackets || TAX_BRACKETS
  const { totalMain, totalPartTime, totalGross } = sumIncome(profile?.income?.months)
  const totalReliefs = sumReliefs(profile?.reliefs)
  const chargeableIncome = Math.max(0, totalGross - totalReliefs)
  const { total: grossTax, breakdown } = calcGrossTax(chargeableIncome, brackets)
  const pcbPaid = sumPcb(profile?.pcbPaid)
  const balance = grossTax - pcbPaid
  return {
    totalMain, totalPartTime, totalGross, totalReliefs,
    chargeableIncome, grossTax, breakdown, pcbPaid,
    balance, isRefund: balance < 0,
    effectiveRate: totalGross > 0 ? grossTax / totalGross : 0,
  }
}
