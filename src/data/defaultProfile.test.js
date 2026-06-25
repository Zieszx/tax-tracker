import { defaultProfile, blankProfile } from './defaultProfile.js'
import { computeTax } from '../engine/tax.js'

test('default profile has 12 months', () => {
  expect(defaultProfile.income.months).toHaveLength(12)
})

test('default profile gross is in the expected ~72.5k range', () => {
  const r = computeTax(defaultProfile)
  expect(r.totalGross).toBeGreaterThan(68000)
  expect(r.totalGross).toBeLessThan(78000)
})

test('default profile PCB paid totals 627.45', () => {
  const r = computeTax(defaultProfile)
  expect(r.pcbPaid).toBeCloseTo(627.45, 2)
})

test('blank profile has zero gross', () => {
  const r = computeTax(blankProfile)
  expect(r.totalGross).toBe(0)
})
