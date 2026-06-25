import { materializeMonths } from './materialize.js'
const main = { id:'m', type:'main', monthlyGross:4500, monthsActive:{from:1,to:12} }
const part = { id:'p', type:'part', amountPerPayment:1000, schedule:'1st & 15th', monthsActive:{from:1,to:12} }
test('projects 12 months with main + biweekly part-time', () => {
  const months = materializeMonths([main, part], {}, 2026)
  expect(months).toHaveLength(12)
  expect(months[0]).toMatchObject({ month:'2026-01', mainSalary:4500 })
  expect(months[0].partTime).toHaveLength(2)
  expect(months[0].partTime[0]).toMatchObject({ date:'2026-01-01', amount:1000 })
})
test('monthsActive range excludes outside months', () => {
  const m = materializeMonths([{ ...main, monthsActive:{from:3,to:6} }], {}, 2026)
  expect(m[0].mainSalary).toBe(0)
  expect(m[2].mainSalary).toBe(4500)
  expect(m[11].mainSalary).toBe(0)
})
test('override replaces projected month', () => {
  const m = materializeMonths([main], { '2026-02': { mainSalary: 9999, partTime: [] } }, 2026)
  expect(m[1].mainSalary).toBe(9999)
})
