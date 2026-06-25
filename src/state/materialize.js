/**
 * materialize.js — pure projection of income sources into Month[].
 * No React / DOM imports allowed.
 */

/**
 * Pad a number to 2 digits.
 * @param {number} n
 * @returns {string}
 */
function pad2(n) {
  return String(n).padStart(2, '0')
}

/**
 * Build the YYYY-MM key for a given year + 1-based month.
 * @param {number} year
 * @param {number} month  1-12
 * @returns {string}
 */
function monthKey(year, month) {
  return `${year}-${pad2(month)}`
}

/**
 * Expand a part-time source into entries for a single month.
 * @param {{ amountPerPayment:number, schedule:string }} source
 * @param {number} year
 * @param {number} month  1-based
 * @returns {{ date:string, amount:number, note:string }[]}
 */
function expandPartTime(source, year, month) {
  const mk = monthKey(year, month)
  const amount = source.amountPerPayment || 0
  const note = source.name || ''

  if (source.schedule === '1st & 15th') {
    return [
      { date: `${mk}-01`, amount, note },
      { date: `${mk}-15`, amount, note },
    ]
  }
  // 'monthly' or anything else → one entry on the 1st
  return [{ date: `${mk}-01`, amount, note }]
}

/**
 * Materialize all income sources into a 12-element Month array for the given
 * year, then apply any per-month overrides.
 *
 * @param {Array<{ id:string, type:'main'|'part', monthlyGross?:number, amountPerPayment?:number, schedule?:string, monthsActive:{from:number, to:number} }>} incomeSources
 * @param {Record<string, { mainSalary?:number, partTime?:Array }>} monthOverrides
 * @param {number} year
 * @returns {{ month:string, mainSalary:number, partTime:Array }[]}
 */
export function materializeMonths(incomeSources = [], monthOverrides = {}, year) {
  const months = []

  for (let m = 1; m <= 12; m++) {
    const key = monthKey(year, m)

    // --- projection ---
    let mainSalary = 0
    let partTime = []

    for (const src of incomeSources) {
      const { from, to } = src.monthsActive || { from: 1, to: 12 }
      if (m < from || m > to) continue

      if (src.type === 'main') {
        mainSalary += src.monthlyGross || 0
      } else if (src.type === 'part') {
        partTime = partTime.concat(expandPartTime(src, year, m))
      }
    }

    // --- override ---
    const ov = monthOverrides[key]
    if (ov) {
      if (ov.mainSalary !== undefined) mainSalary = ov.mainSalary
      if (ov.partTime !== undefined) partTime = ov.partTime
    }

    months.push({ month: key, mainSalary, partTime })
  }

  return months
}
