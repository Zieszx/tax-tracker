/**
 * currentMonth.js — pure helper for the "current month" within a tax year.
 */

/** The month to treat as current — the real current month when we're viewing the
 *  current calendar year, otherwise January of the active year. */
export function defaultRecordMonth(taxYear, now = new Date()) {
  if (now.getFullYear() === taxYear) {
    return `${taxYear}-${String(now.getMonth() + 1).padStart(2, '0')}`
  }
  return `${taxYear}-01`
}
