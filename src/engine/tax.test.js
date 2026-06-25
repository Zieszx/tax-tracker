import { calcGrossTax, sumIncome, sumReliefs, sumPcb, computeTax } from './tax.js'

test('calcGrossTax is progressive across brackets', () => {
  // 30000 chargeable: 0% on first 5000, 1% on next 15000 (150), 3% on next 10000 (300) = 450
  const { total } = calcGrossTax(30000)
  expect(total).toBeCloseTo(450, 2)
})

test('calcGrossTax returns 0 at or below 5000', () => {
  expect(calcGrossTax(5000).total).toBeCloseTo(0, 2)
  expect(calcGrossTax(0).total).toBeCloseTo(0, 2)
})

test('calcGrossTax breakdown has 3 non-zero bands for 30000 chargeable', () => {
  const { breakdown } = calcGrossTax(30000)
  const taxedBands = breakdown.filter(b => b.taxable > 0)
  expect(taxedBands.length).toBe(3)
})

test('calcGrossTax returns 0 for negative chargeable income', () => {
  expect(calcGrossTax(-1000).total).toBe(0)
})

test('calcGrossTax honors custom brackets override', () => {
  const customBrackets = [
    { min: 0, max: 1000, rate: 0 },
    { min: 1000, max: null, rate: 0.5 },
  ]
  // 2000 chargeable: 0 on first 1000, then 1000 * 0.5 = 500
  expect(calcGrossTax(2000, customBrackets).total).toBeCloseTo(500, 2)
})

test('sumIncome totals main and part-time', () => {
  const months = [
    { mainSalary: 3100, partTime: [{ amount: 333.33 }] },
    { mainSalary: 4500, partTime: [{ amount: 1000 }, { amount: 1000 }] },
  ]
  const r = sumIncome(months)
  expect(r.totalMain).toBeCloseTo(7600, 2)
  expect(r.totalPartTime).toBeCloseTo(2333.33, 2)
  expect(r.totalGross).toBeCloseTo(9933.33, 2)
})

test('sumReliefs caps each relief at its limit', () => {
  const reliefs = [
    { amount: 9000, limit: 9000 },
    { amount: 5000, limit: 2500 }, // over limit -> 2500
  ]
  expect(sumReliefs(reliefs)).toBeCloseTo(11500, 2)
})

test('sumPcb totals payments', () => {
  expect(sumPcb([{ amount: 79.35 }, { amount: 468.90 }])).toBeCloseTo(548.25, 2)
})

test('computeTax produces a refund when PCB exceeds gross tax', () => {
  const profile = {
    income: { months: [{ mainSalary: 30000, partTime: [] }] },
    reliefs: [{ amount: 9000, limit: 9000 }],
    pcbPaid: [{ amount: 1000 }],
  }
  // chargeable = 30000-9000 = 21000 -> 0 + 150 + 30 = 180 gross tax
  const r = computeTax(profile)
  expect(r.chargeableIncome).toBeCloseTo(21000, 2)
  expect(r.grossTax).toBeCloseTo(180, 2)
  expect(r.balance).toBeCloseTo(-820, 2)
  expect(r.isRefund).toBe(true)
})
