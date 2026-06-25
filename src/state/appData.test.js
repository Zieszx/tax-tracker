import { blankAppData, blankYearProfile, migrateV1, SCHEMA_VERSION } from './appData.js'
import { defaultProfile } from '../data/defaultProfile.js'
import { computeTax } from '../engine/tax.js'
import { materializeMonths } from './materialize.js'  // available after Task 1.4 — order 1.4 before running

test('blankAppData has schema 2, one year, not onboarded', () => {
  const d = blankAppData(2026)
  expect(d.schemaVersion).toBe(2)
  expect(Object.keys(d.years)).toEqual(['2026'])
  expect(d.settings.onboarded).toBe(false)
})
test('migrateV1 preserves gross and PCB via overrides', () => {
  const yp = migrateV1(defaultProfile)
  const months = materializeMonths(yp.incomeSources, yp.monthOverrides, 2026)
  const r = computeTax({ income:{months}, reliefs: yp.reliefs, pcbPaid: yp.pcbPaid, settings:{taxBrackets: yp.taxBrackets} })
  expect(r.pcbPaid).toBeCloseTo(627.45, 2)
  expect(r.totalGross).toBeGreaterThan(68000)
  expect(r.totalGross).toBeLessThan(78000)
})
