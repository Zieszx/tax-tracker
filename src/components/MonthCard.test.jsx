/**
 * MonthCard.test.jsx — Task B3 TDD
 *
 * Tests:
 * - renders status badge from override.confirmed (Actual/Projected)
 * - editing the main input calls onChange with the new value
 * - editing the part-time input calls onChange
 * - editing the PCB input calls onChange
 * - Record button calls onRecord
 * - Clear button calls onClear
 * - aria-labels include the month key
 * - isCurrent marker renders "This month"
 */

import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import MonthCard from './MonthCard.jsx'

const MONTH_KEY = '2026-03'

const baseProjected = {
  month: MONTH_KEY,
  mainSalary: 5000,
  partTime: [],
}

const projectedOverride = null // no override → projected

const actualOverride = {
  mainSalary: 4800,
  partTime: [{ date: '2026-03-15', amount: 300, note: 'Freelance' }],
  confirmed: true,
}

test('renders Projected badge when override has no confirmed', () => {
  render(
    <MonthCard
      monthKey={MONTH_KEY}
      projected={baseProjected}
      override={projectedOverride}
      pcb={0}
      onChange={() => {}}
      onRecord={() => {}}
      onClear={() => {}}
      isCurrent={false}
    />
  )
  expect(screen.getByText(/projected/i)).toBeInTheDocument()
})

test('renders Actual badge when override.confirmed is true', () => {
  render(
    <MonthCard
      monthKey={MONTH_KEY}
      projected={baseProjected}
      override={actualOverride}
      pcb={0}
      onChange={() => {}}
      onRecord={() => {}}
      onClear={() => {}}
      isCurrent={false}
    />
  )
  // The status badge specifically (not the "Record as actual" button text)
  const badge = document.querySelector('.month-card-badge')
  expect(badge).not.toBeNull()
  expect(badge.textContent).toMatch(/actual/i)
})

test('editing main salary input calls onChange with updated mainSalary', () => {
  const onChange = vi.fn()
  render(
    <MonthCard
      monthKey={MONTH_KEY}
      projected={baseProjected}
      override={projectedOverride}
      pcb={0}
      onChange={onChange}
      onRecord={() => {}}
      onClear={() => {}}
      isCurrent={false}
    />
  )
  const mainInput = screen.getByLabelText(/main salary.*2026-03/i)
  fireEvent.change(mainInput, { target: { value: '6000' } })
  expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ mainSalary: 6000 }))
})

test('editing part-time input calls onChange', () => {
  const onChange = vi.fn()
  render(
    <MonthCard
      monthKey={MONTH_KEY}
      projected={baseProjected}
      override={projectedOverride}
      pcb={0}
      onChange={onChange}
      onRecord={() => {}}
      onClear={() => {}}
      isCurrent={false}
    />
  )
  // Use exact label to avoid matching the part-time mode toggle group
  const partInput = screen.getByLabelText(`part-time ${MONTH_KEY}`)
  fireEvent.change(partInput, { target: { value: '500' } })
  expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ partTimeTotal: 500 }))
})

test('editing PCB input calls onChange', () => {
  const onChange = vi.fn()
  render(
    <MonthCard
      monthKey={MONTH_KEY}
      projected={baseProjected}
      override={projectedOverride}
      pcb={0}
      onChange={onChange}
      onRecord={() => {}}
      onClear={() => {}}
      isCurrent={false}
    />
  )
  const pcbInput = screen.getByLabelText(/pcb.*2026-03/i)
  fireEvent.change(pcbInput, { target: { value: '200' } })
  expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ pcb: 200 }))
})

test('Record button calls onRecord', () => {
  const onRecord = vi.fn()
  render(
    <MonthCard
      monthKey={MONTH_KEY}
      projected={baseProjected}
      override={projectedOverride}
      pcb={0}
      onChange={() => {}}
      onRecord={onRecord}
      onClear={() => {}}
      isCurrent={false}
    />
  )
  fireEvent.click(screen.getByRole('button', { name: /record.*2026-03/i }))
  expect(onRecord).toHaveBeenCalledTimes(1)
})

test('Clear button calls onClear', () => {
  const onClear = vi.fn()
  render(
    <MonthCard
      monthKey={MONTH_KEY}
      projected={baseProjected}
      override={actualOverride}
      pcb={120}
      onChange={() => {}}
      onRecord={() => {}}
      onClear={onClear}
      isCurrent={false}
    />
  )
  fireEvent.click(screen.getByRole('button', { name: /clear.*2026-03/i }))
  expect(onClear).toHaveBeenCalledTimes(1)
})

test('aria-labels include the month key', () => {
  render(
    <MonthCard
      monthKey={MONTH_KEY}
      projected={baseProjected}
      override={projectedOverride}
      pcb={0}
      onChange={() => {}}
      onRecord={() => {}}
      onClear={() => {}}
      isCurrent={false}
    />
  )
  expect(screen.getByLabelText(`main salary ${MONTH_KEY}`)).toBeInTheDocument()
  expect(screen.getByLabelText(`part-time ${MONTH_KEY}`)).toBeInTheDocument()
  expect(screen.getByLabelText(`pcb ${MONTH_KEY}`)).toBeInTheDocument()
})

test('renders "This month" marker when isCurrent is true', () => {
  render(
    <MonthCard
      monthKey={MONTH_KEY}
      projected={baseProjected}
      override={projectedOverride}
      pcb={0}
      onChange={() => {}}
      onRecord={() => {}}
      onClear={() => {}}
      isCurrent={true}
    />
  )
  expect(screen.getByText(/this month/i)).toBeInTheDocument()
})

test('Clear button is not rendered when there is no override', () => {
  render(
    <MonthCard
      monthKey={MONTH_KEY}
      projected={baseProjected}
      override={projectedOverride}
      pcb={0}
      onChange={() => {}}
      onRecord={() => {}}
      onClear={() => {}}
      isCurrent={false}
    />
  )
  expect(screen.queryByRole('button', { name: /clear.*2026-03/i })).toBeNull()
})
