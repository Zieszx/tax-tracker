import { calcEPF, calcSOCSO, calcEIS } from './deductions.js'

test('EPF is 11% of gross', () => {
  expect(calcEPF(4500)).toBeCloseTo(495, 2)
})

test('SOCSO is 0.5% capped at 19.75', () => {
  expect(calcSOCSO(3000)).toBeCloseTo(15, 2)
  expect(calcSOCSO(4500)).toBeCloseTo(19.75, 2) // capped
})

test('EIS is 0.2% of first 4000', () => {
  expect(calcEIS(3000)).toBeCloseTo(6, 2)
  expect(calcEIS(4500)).toBeCloseTo(8, 2) // 4000*0.002
})
