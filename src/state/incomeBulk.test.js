/**
 * incomeBulk.test.js — TDD tests for pure bulk-action helpers.
 * No React / DOM imports.
 */

import { copyMonthToRest, fillProjectedFromAverage, applyMainToAll } from './incomeBulk.js'

// ── shared fixtures ─────────────────────────────────────────────────────────

/** A main income source (RM 5000/month, all year). */
const mainSrc = {
  id: 'main-0',
  type: 'main',
  monthlyGross: 5000,
  monthsActive: { from: 1, to: 12 },
}

/** A part-time income source (RM 1000/payment, 1st & 15th). */
const partSrc = {
  id: 'part-0',
  type: 'part',
  name: 'Nuvera',
  amountPerPayment: 1000,
  schedule: '1st & 15th',
  monthsActive: { from: 1, to: 12 },
}

/** Bare-minimum YearProfile with known tax year 2026. */
function makeYear(overrides = {}) {
  return {
    taxYear: 2026,
    incomeSources: [mainSrc, partSrc],
    monthOverrides: {},
    ...overrides,
  }
}

// ── copyMonthToRest ──────────────────────────────────────────────────────────

describe('copyMonthToRest', () => {
  test('copies effective values from fromMonth to every subsequent month', () => {
    // Override March (2026-03) with specific values
    const year = makeYear({
      monthOverrides: {
        '2026-03': { mainSalary: 7000, partTime: [{ date: '2026-03-15', amount: 500, note: 'bonus' }] },
      },
    })

    const result = copyMonthToRest(year, '2026-03')

    // April through December should all have the effective March values
    for (let m = 4; m <= 12; m++) {
      const key = `2026-${String(m).padStart(2, '0')}`
      expect(result[key]).toMatchObject({
        mainSalary: 7000,
        partTime: [{ date: '2026-03-15', amount: 500, note: 'bonus' }],
      })
      // Should NOT set confirmed
      expect(result[key].confirmed).toBeUndefined()
    }
  })

  test('months before fromMonth are unchanged', () => {
    const year = makeYear({
      monthOverrides: {
        '2026-03': { mainSalary: 7000, partTime: [] },
        '2026-01': { mainSalary: 9999, partTime: [], confirmed: true },
      },
    })

    const result = copyMonthToRest(year, '2026-03')

    // Jan should remain untouched
    expect(result['2026-01']).toMatchObject({ mainSalary: 9999, confirmed: true })
    // Feb should remain at projected (or whatever it was — either absent or unchanged)
    // The key point: months 1-3 are NOT overwritten
    expect(result['2026-02']).toEqual(year.monthOverrides['2026-02'])
    expect(result['2026-03']).toEqual(year.monthOverrides['2026-03'])
  })

  test('uses projected values when fromMonth has no override', () => {
    // No overrides — fromMonth=2026-02, should use projected main=5000, part from sources
    const year = makeYear()
    const result = copyMonthToRest(year, '2026-02')

    // March through December should all have projected values
    for (let m = 3; m <= 12; m++) {
      const key = `2026-${String(m).padStart(2, '0')}`
      expect(result[key].mainSalary).toBe(5000)
      // part-time: 1st & 15th → 2 entries of 1000 each (from the projected month, which is the
      // effective value of 2026-02: date keys will reflect the *source month* 2026-02)
      expect(result[key].partTime).toHaveLength(2)
    }
  })

  test('returns a new object (does not mutate year.monthOverrides)', () => {
    const year = makeYear({
      monthOverrides: { '2026-03': { mainSalary: 7000, partTime: [] } },
    })
    const orig = { ...year.monthOverrides }
    copyMonthToRest(year, '2026-03')
    expect(year.monthOverrides).toEqual(orig)
  })
})

// ── fillProjectedFromAverage ─────────────────────────────────────────────────

describe('fillProjectedFromAverage', () => {
  test('fills non-confirmed months with average of confirmed months', () => {
    // Confirm Jan (10 000 main, 2000 part) and Feb (6 000 main, 4000 part)
    const year = makeYear({
      monthOverrides: {
        '2026-01': {
          mainSalary: 10000,
          partTime: [{ date: '2026-01-01', amount: 2000, note: 'A' }],
          confirmed: true,
        },
        '2026-02': {
          mainSalary: 6000,
          partTime: [{ date: '2026-02-15', amount: 4000, note: 'B' }],
          confirmed: true,
        },
      },
    })

    const result = fillProjectedFromAverage(year)

    // avg main = (10000 + 6000) / 2 = 8000
    // avg part = (2000 + 4000) / 2 = 3000
    for (let m = 3; m <= 12; m++) {
      const key = `2026-${String(m).padStart(2, '0')}`
      expect(result[key]).toMatchObject({
        mainSalary: 8000,
        partTime: [{ amount: 3000, note: 'Avg' }],
      })
      // The date should be YYYY-MM-15
      expect(result[key].partTime[0].date).toBe(`${key}-15`)
    }
  })

  test('confirmed months are NOT overwritten', () => {
    const year = makeYear({
      monthOverrides: {
        '2026-01': {
          mainSalary: 10000,
          partTime: [],
          confirmed: true,
        },
      },
    })

    const result = fillProjectedFromAverage(year)

    // Jan stays exactly as-is
    expect(result['2026-01']).toMatchObject({ mainSalary: 10000, confirmed: true })
  })

  test('omits partTime entry when average part-time is 0', () => {
    const year = makeYear({
      incomeSources: [mainSrc], // no part-time source
      monthOverrides: {
        '2026-01': { mainSalary: 5000, partTime: [], confirmed: true },
      },
    })

    const result = fillProjectedFromAverage(year)

    for (let m = 2; m <= 12; m++) {
      const key = `2026-${String(m).padStart(2, '0')}`
      expect(result[key].mainSalary).toBe(5000)
      // partTime should be absent (omitted) or an empty array — spec says "omit partTime entry if avg is 0"
      expect(result[key].partTime == null || result[key].partTime.length === 0).toBe(true)
    }
  })

  test('returns overrides unchanged when there are no confirmed months', () => {
    const year = makeYear({
      monthOverrides: {
        '2026-01': { mainSalary: 3000, partTime: [] },
      },
    })

    const result = fillProjectedFromAverage(year)

    expect(result).toEqual(year.monthOverrides)
  })

  test('returns a new object (does not mutate year.monthOverrides)', () => {
    const year = makeYear({
      monthOverrides: {
        '2026-01': { mainSalary: 5000, partTime: [], confirmed: true },
      },
    })
    const orig = JSON.stringify(year.monthOverrides)
    fillProjectedFromAverage(year)
    expect(JSON.stringify(year.monthOverrides)).toBe(orig)
  })
})

// ── applyMainToAll ───────────────────────────────────────────────────────────

describe('applyMainToAll', () => {
  test('sets mainSalary on all 12 months', () => {
    const year = makeYear()
    const result = applyMainToAll(year, 8500)

    for (let m = 1; m <= 12; m++) {
      const key = `2026-${String(m).padStart(2, '0')}`
      expect(result[key].mainSalary).toBe(8500)
    }
  })

  test('preserves existing partTime on months that already have an override', () => {
    const existingPart = [{ date: '2026-03-01', amount: 999, note: 'bonus' }]
    const year = makeYear({
      monthOverrides: {
        '2026-03': { mainSalary: 0, partTime: existingPart, confirmed: true },
      },
    })

    const result = applyMainToAll(year, 6000)

    expect(result['2026-03'].mainSalary).toBe(6000)
    expect(result['2026-03'].partTime).toEqual(existingPart)
    expect(result['2026-03'].confirmed).toBe(true)
  })

  test('preserves existing confirmed flag on months that already have an override', () => {
    const year = makeYear({
      monthOverrides: {
        '2026-05': { mainSalary: 4000, partTime: [], confirmed: true },
      },
    })

    const result = applyMainToAll(year, 5500)

    expect(result['2026-05'].confirmed).toBe(true)
  })

  test('months without existing override get only mainSalary set (no partTime or confirmed)', () => {
    const year = makeYear()
    const result = applyMainToAll(year, 7000)

    // Month 1 — no prior override
    expect(result['2026-01']).toEqual({ mainSalary: 7000 })
  })

  test('returns a new object (does not mutate year.monthOverrides)', () => {
    const year = makeYear({
      monthOverrides: { '2026-01': { mainSalary: 1000, partTime: [] } },
    })
    const orig = JSON.stringify(year.monthOverrides)
    applyMainToAll(year, 5000)
    expect(JSON.stringify(year.monthOverrides)).toBe(orig)
  })

  test('exactly 12 month keys are written', () => {
    const year = makeYear()
    const result = applyMainToAll(year, 5000)
    const keys = Object.keys(result).filter((k) => k.startsWith('2026-'))
    expect(keys).toHaveLength(12)
  })
})
