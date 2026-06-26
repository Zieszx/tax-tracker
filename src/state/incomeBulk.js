/**
 * incomeBulk.js — pure bulk-action helpers for monthOverrides.
 * Pure module: NO React / DOM imports.
 *
 * All functions accept a YearProfile and return a NEW monthOverrides object.
 * They never mutate the input.
 */

import { materializeMonths } from './materialize.js'

/**
 * Pad a number to 2 digits.
 * @param {number} n
 * @returns {string}
 */
function pad2(n) {
  return String(n).padStart(2, '0')
}

/**
 * Build the YYYY-MM key for a given year + 1-based month number.
 * @param {number} year
 * @param {number} month  1–12
 * @returns {string}
 */
function mkKey(year, month) {
  return `${year}-${pad2(month)}`
}

// ── copyMonthToRest ──────────────────────────────────────────────────────────

/**
 * Copy the **effective** income of `fromMonth` to every subsequent month in
 * `year.taxYear`. Does NOT set `confirmed` on the target months.
 *
 * @param {{ taxYear:number, incomeSources:Array, monthOverrides:Record<string,object> }} year
 * @param {string} fromMonth  YYYY-MM key (e.g. "2026-03")
 * @returns {Record<string,object>}  new monthOverrides
 */
export function copyMonthToRest(year, fromMonth) {
  const { taxYear, incomeSources = [], monthOverrides = {} } = year

  // Materialise all 12 months to get the effective value of fromMonth
  const materialized = materializeMonths(incomeSources, monthOverrides, taxYear)

  // Find the month entry for fromMonth
  const sourceMonth = materialized.find((m) => m.month === fromMonth)
  if (!sourceMonth) return { ...monthOverrides }

  // The month number of fromMonth (1-based)
  const fromNum = parseInt(fromMonth.slice(5), 10)

  const next = { ...monthOverrides }

  for (let m = fromNum + 1; m <= 12; m++) {
    const key = mkKey(taxYear, m)
    // Spread existing override to preserve any extra fields, then overwrite income fields.
    // But the spec says "set override { mainSalary, partTime } = effective values" — do NOT
    // copy confirmed. Preserve any pre-existing confirmed on the target (not mentioned in spec
    // but safer) — actually spec says "Does not set confirmed", meaning we leave it absent.
    const existing = next[key] ?? {}
    next[key] = {
      ...existing,
      mainSalary: sourceMonth.mainSalary,
      partTime: sourceMonth.partTime.map((p) => ({ ...p })),
      // Deliberately do NOT copy confirmed
    }
    // Remove confirmed if it would be set (spec: "Does not set confirmed")
    // Leave it as-is if it was already there — spec only says we don't SET it from the source.
    // The natural reading: we don't propagate confirmed from fromMonth to targets.
    // Targets keep their own confirmed status.
  }

  return next
}

// ── fillProjectedFromAverage ─────────────────────────────────────────────────

/**
 * Average the main and part-time totals across **confirmed** months.
 * For each **non-confirmed** month, set override:
 *   `{ mainSalary: avgMain, partTime: [{ date: 'YYYY-MM-15', amount: avgPart, note: 'Avg' }] }`
 * Omits the `partTime` entry entirely when avgPart is 0.
 * If there are no confirmed months, returns `monthOverrides` unchanged.
 *
 * @param {{ taxYear:number, incomeSources:Array, monthOverrides:Record<string,object> }} year
 * @returns {Record<string,object>}  new monthOverrides
 */
export function fillProjectedFromAverage(year) {
  const { taxYear, incomeSources = [], monthOverrides = {} } = year

  const materialized = materializeMonths(incomeSources, monthOverrides, taxYear)

  // Identify confirmed months
  const confirmedMonths = materialized.filter((m) => {
    const ov = monthOverrides[m.month]
    return ov && ov.confirmed === true
  })

  if (confirmedMonths.length === 0) return { ...monthOverrides }

  // Average main salary across confirmed months
  const totalMain = confirmedMonths.reduce((sum, m) => sum + (m.mainSalary ?? 0), 0)
  const avgMain = totalMain / confirmedMonths.length

  // Average part-time total (sum of all part-time entries) across confirmed months
  const totalPart = confirmedMonths.reduce((sum, m) => {
    const partSum = (m.partTime ?? []).reduce((s, p) => s + (p.amount ?? 0), 0)
    return sum + partSum
  }, 0)
  const avgPart = totalPart / confirmedMonths.length

  const next = { ...monthOverrides }

  for (const m of materialized) {
    const ov = monthOverrides[m.month]
    // Skip confirmed months
    if (ov && ov.confirmed === true) continue

    const entry = {
      mainSalary: avgMain,
    }

    if (avgPart !== 0) {
      entry.partTime = [{ date: `${m.month}-15`, amount: avgPart, note: 'Avg' }]
    }

    next[m.month] = entry
  }

  return next
}

// ── applyMainToAll ───────────────────────────────────────────────────────────

/**
 * Set `mainSalary: amount` on every month's override.
 * Preserves any existing `partTime` and `confirmed` on months that already
 * have an override.
 *
 * @param {{ taxYear:number, monthOverrides:Record<string,object> }} year
 * @param {number} amount
 * @returns {Record<string,object>}  new monthOverrides
 */
export function applyMainToAll(year, amount) {
  const { taxYear, monthOverrides = {} } = year

  const next = { ...monthOverrides }

  for (let m = 1; m <= 12; m++) {
    const key = mkKey(taxYear, m)
    const existing = next[key]
    if (existing) {
      // Preserve all existing fields; overwrite only mainSalary
      next[key] = { ...existing, mainSalary: amount }
    } else {
      // Fresh override — only set mainSalary (no partTime, no confirmed)
      next[key] = { mainSalary: amount }
    }
  }

  return next
}
