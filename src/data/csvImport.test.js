/**
 * csvImport.test.js — Task 4.2: Bank CSV import (parser)
 *
 * TDD: tests written BEFORE implementation to drive design.
 * Covers parseBankCsv and creditsToPartTime with Bank Islam-style CSV.
 */

import { parseBankCsv, creditsToPartTime } from './csvImport.js'

// Sample Bank Islam-style CSV: Date, Description, Debit, Credit, Balance
const SAMPLE_CSV = `Date,Description,Debit,Credit,Balance
01/01/2026,Opening Balance,,0.00,5000.00
05/01/2026,FREELANCE PAYMENT,,1500.00,6500.00
10/01/2026,BILL PAYMENT - TNB,200.00,,6300.00
15/01/2026,PART-TIME CONSULTING,,800.00,7100.00
20/01/2026,ATM WITHDRAWAL,500.00,,6600.00
03/02/2026,FREELANCE JAN FINAL,,2200.00,8800.00
15/02/2026,PURCHASE - SHOPEE,300.00,,8500.00
`

const SAMPLE_CSV_QUOTED = `"Date","Description","Debit","Credit","Balance"
"05/01/2026","PAYMENT RECEIVED","","1500.00","6500.00"
"10/01/2026","SALARY CREDIT","","4500.00","11000.00"
"15/01/2026","WITHDRAWAL","300.00","","10700.00"
`

const MALFORMED_CSV = `Date,Description,Debit,Credit,Balance
,,,,
notadate,description,abc,xyz,nope
05/01/2026,VALID CREDIT,,100.00,5100.00
`

test('parseBankCsv returns only credit rows', () => {
  const { rows } = parseBankCsv(SAMPLE_CSV)
  // Credits: 0.00 opening (skip zero), 1500.00, 800.00 in Jan, 2200.00 in Feb
  // Zero-credit row (0.00 for opening) should be excluded; debit rows excluded
  // → 3 non-zero credit rows
  const nonZero = rows.filter((r) => r.credit > 0)
  expect(nonZero.length).toBe(3)
  nonZero.forEach((r) => expect(r.credit).toBeGreaterThan(0))
})

test('parseBankCsv debit rows are not included as credits', () => {
  const { rows } = parseBankCsv(SAMPLE_CSV)
  // No row should have a debit without credit (debit-only rows excluded)
  rows.forEach((r) => expect(r.credit).toBeGreaterThan(0))
})

test('parseBankCsv parses date and description fields', () => {
  const { rows } = parseBankCsv(SAMPLE_CSV)
  const first = rows[0]
  expect(first.date).toMatch(/2026/) // parsed date contains year
  expect(first.description).toBeTruthy()
})

test('parseBankCsv handles quoted fields', () => {
  const { rows } = parseBankCsv(SAMPLE_CSV_QUOTED)
  expect(rows.length).toBe(2)
  expect(rows[0].credit).toBe(1500)
  expect(rows[1].credit).toBe(4500)
})

test('parseBankCsv skips malformed and blank lines gracefully', () => {
  const { rows } = parseBankCsv(MALFORMED_CSV)
  // Only the valid credit row should appear
  expect(rows.length).toBe(1)
  expect(rows[0].credit).toBe(100)
})

test('parseBankCsv handles case-insensitive headers', () => {
  const csv = `date,description,debit,credit,balance\n05/01/2026,PAYMENT,,250.00,5250.00`
  const { rows } = parseBankCsv(csv)
  expect(rows.length).toBe(1)
  expect(rows[0].credit).toBe(250)
})

test('creditsToPartTime maps credit rows to correct months', () => {
  const { rows } = parseBankCsv(SAMPLE_CSV)
  const entries = creditsToPartTime(rows, 2026)
  // Jan credits: 1500 (05/01) and 800 (15/01) → month 2026-01
  const janEntries = entries.filter((e) => e.month === '2026-01')
  expect(janEntries.length).toBe(2)
  const amounts = janEntries.map((e) => e.entry.amount).sort((a, b) => a - b)
  expect(amounts).toEqual([800, 1500])
})

test('creditsToPartTime maps February credit to 2026-02', () => {
  const { rows } = parseBankCsv(SAMPLE_CSV)
  const entries = creditsToPartTime(rows, 2026)
  const febEntries = entries.filter((e) => e.month === '2026-02')
  expect(febEntries.length).toBe(1)
  expect(febEntries[0].entry.amount).toBe(2200)
})

test('creditsToPartTime entry has date, amount, note fields', () => {
  const { rows } = parseBankCsv(SAMPLE_CSV)
  const entries = creditsToPartTime(rows, 2026)
  const entry = entries[0].entry
  expect(entry).toHaveProperty('date')
  expect(entry).toHaveProperty('amount')
  expect(entry).toHaveProperty('note')
  expect(typeof entry.amount).toBe('number')
})

test('creditsToPartTime filters out rows from wrong year', () => {
  const csv = `Date,Description,Debit,Credit,Balance
05/01/2025,PAYMENT,,500.00,500.00
05/01/2026,PAYMENT,,300.00,300.00
`
  const { rows } = parseBankCsv(csv)
  // parseBankCsv returns all credit rows; creditsToPartTime filters by year
  const entries = creditsToPartTime(rows, 2026)
  expect(entries.length).toBe(1)
  expect(entries[0].month).toBe('2026-01')
})
