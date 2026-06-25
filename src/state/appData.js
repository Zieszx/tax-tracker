/**
 * appData.js — v2 AppData schema, defaults, and v1→v2 migration.
 * Pure module: NO React / DOM imports.
 */

import { RELIEF_TEMPLATE } from '../data/defaultProfile.js'

export const SCHEMA_VERSION = 2

/**
 * Create a blank YearProfile for the given tax year.
 * @param {number} year
 * @returns {YearProfile}
 */
export function blankYearProfile(year) {
  return {
    taxYear: year,
    residentStatus: 'resident',
    maritalStatus: 'single',
    incomeSources: [],
    monthOverrides: {},
    pcbPaid: [],
    reliefs: RELIEF_TEMPLATE.map((r) => ({ ...r })),
    taxBrackets: undefined,
    savings: { entries: [] },
  }
}

/**
 * Create a blank AppData with one year initialized.
 * @param {number} [year=2026]
 * @returns {AppData}
 */
export function blankAppData(year = 2026) {
  return {
    schemaVersion: SCHEMA_VERSION,
    settings: {
      theme: 'system',
      autoLockMinutes: 5,
      onboarded: false,
    },
    activeYear: year,
    years: {
      [year]: blankYearProfile(year),
    },
  }
}

/**
 * Convert a v1 defaultProfile-shaped object into a v2 YearProfile.
 *
 * Strategy:
 * - Create a Main Job income source with monthlyGross = 4500 (modal v1 salary)
 * - Create a Nuvera Part-time source with amountPerPayment = 1000, schedule = '1st & 15th'
 * - Store every v1 month as a monthOverride so the exact per-month figures are preserved
 * - Copy pcbPaid, reliefs, taxBrackets
 *
 * @param {object} v1profile  The v1 defaultProfile-shaped object
 * @returns {YearProfile}
 */
export function migrateV1(v1profile) {
  const taxYear = v1profile?.settings?.taxYear || 2026

  // Build incomeSources (these define the "template" projection; overrides supply actual values)
  const incomeSources = [
    {
      id: 'main-0',
      type: 'main',
      name: 'Main employer',
      monthlyGross: 4500,
      monthsActive: { from: 1, to: 12 },
      autoStatutory: true,
    },
    {
      id: 'part-0',
      type: 'part',
      name: 'Nuvera',
      amountPerPayment: 1000,
      schedule: '1st & 15th',
      monthsActive: { from: 1, to: 12 },
      autoStatutory: false,
    },
  ]

  // Build monthOverrides from every v1 month — preserves exact per-month figures
  const monthOverrides = {}
  const v1Months = v1profile?.income?.months || []
  for (const m of v1Months) {
    monthOverrides[m.month] = {
      mainSalary: m.mainSalary,
      partTime: m.partTime ? m.partTime.map((p) => ({ ...p })) : [],
    }
  }

  return {
    taxYear,
    residentStatus: v1profile?.settings?.residentStatus || 'resident',
    maritalStatus: v1profile?.settings?.maritalStatus || 'single',
    incomeSources,
    monthOverrides,
    pcbPaid: v1profile?.pcbPaid ? v1profile.pcbPaid.map((p) => ({ ...p })) : [],
    reliefs: v1profile?.reliefs ? v1profile.reliefs.map((r) => ({ ...r })) : RELIEF_TEMPLATE.map((r) => ({ ...r })),
    taxBrackets: v1profile?.settings?.taxBrackets,
    savings: { entries: [] },
  }
}
