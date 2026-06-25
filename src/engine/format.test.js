import { formatRM, formatPct } from './format.js'

test('formatRM adds RM prefix, thousands, 2 decimals', () => {
  expect(formatRM(1234.5)).toBe('RM 1,234.50')
  expect(formatRM(0)).toBe('RM 0.00')
  expect(formatRM(-50.4)).toBe('-RM 50.40')
})

test('formatPct converts fraction to 1-dp percent', () => {
  expect(formatPct(0.032)).toBe('3.2%')
  expect(formatPct(0)).toBe('0.0%')
})
