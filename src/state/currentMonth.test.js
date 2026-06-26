import { defaultRecordMonth } from './currentMonth.js'

test('defaultRecordMonth picks the current month within the active year', () => {
  expect(defaultRecordMonth(2026, new Date('2026-06-15T00:00:00'))).toBe('2026-06')
  expect(defaultRecordMonth(2026, new Date('2026-11-02T00:00:00'))).toBe('2026-11')
})

test('defaultRecordMonth falls back to January for a non-current year', () => {
  expect(defaultRecordMonth(2027, new Date('2026-06-15T00:00:00'))).toBe('2027-01')
})
