/**
 * RecordIncomeForm.test.jsx
 *
 * - defaultRecordMonth pure helper
 * - recording a month marks it actual + writes main/part/pcb
 * - itemized part-time stored as entered
 * - clearing reverts a recorded month to projected
 */

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { useEffect, useRef } from 'react'
import { VaultProvider, useVault } from '../security/useVault.jsx'
import { ProfileProvider, useProfile } from '../hooks/useProfile.js'
import RecordIncomeForm, { defaultRecordMonth } from './RecordIncomeForm.jsx'
import { blankYearProfile } from '../state/appData.js'

beforeEach(() => localStorage.clear())

const projectionYear = {
  ...blankYearProfile(2026),
  incomeSources: [
    { id: 'm', type: 'main', name: 'Test Corp', monthlyGross: 3000, monthsActive: { from: 1, to: 12 }, autoStatutory: true },
  ],
  monthOverrides: {},
  pcbPaid: [],
}
const seeded = {
  schemaVersion: 2,
  settings: { theme: 'system', autoLockMinutes: 5, onboarded: true },
  activeYear: 2026,
  years: { 2026: projectionYear },
}

function Harness({ hookRef }) {
  function Probe() {
    hookRef.current = useProfile()
    return null
  }
  function Seeder({ children }) {
    const vault = useVault()
    const s = useRef(false)
    useEffect(() => {
      if (!s.current && vault.status === 'empty') {
        s.current = true
        vault.createVault('test1234', seeded)
      }
    })
    if (vault.status !== 'unlocked') return null
    return children
  }
  return (
    <VaultProvider>
      <Seeder>
        <ProfileProvider>
          <RecordIncomeForm />
          <Probe />
        </ProfileProvider>
      </Seeder>
    </VaultProvider>
  )
}

test('defaultRecordMonth picks the current month within the active year', () => {
  expect(defaultRecordMonth(2026, new Date('2026-06-15T00:00:00'))).toBe('2026-06')
  expect(defaultRecordMonth(2026, new Date('2026-11-02T00:00:00'))).toBe('2026-11')
  // viewing a different year → January of that year
  expect(defaultRecordMonth(2027, new Date('2026-06-15T00:00:00'))).toBe('2027-01')
})

test('recording a month marks it actual and writes main, part-time and PCB', async () => {
  const hookRef = { current: null }
  render(<Harness hookRef={hookRef} />)
  await waitFor(() => expect(hookRef.current?.year).toBeTruthy())

  fireEvent.change(screen.getByLabelText(/record month/i), { target: { value: '2026-03' } })
  fireEvent.change(screen.getByLabelText(/record main salary/i), { target: { value: '5000' } })
  fireEvent.change(screen.getByLabelText(/record part-time total/i), { target: { value: '500' } })
  fireEvent.change(screen.getByLabelText(/record pcb/i), { target: { value: '100' } })

  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: /record as actual/i }))
  })

  await waitFor(() => {
    const yr = hookRef.current.year
    expect(yr.monthOverrides['2026-03'].confirmed).toBe(true)
    expect(yr.monthOverrides['2026-03'].mainSalary).toBe(5000)
    expect(yr.monthOverrides['2026-03'].partTime[0].amount).toBe(500)
    expect(yr.pcbPaid.find((p) => p.month === '2026-03').amount).toBe(100)
  })
})

test('itemized part-time is stored as the entered payments', async () => {
  const hookRef = { current: null }
  render(<Harness hookRef={hookRef} />)
  await waitFor(() => expect(hookRef.current?.year).toBeTruthy())

  fireEvent.change(screen.getByLabelText(/record month/i), { target: { value: '2026-04' } })
  fireEvent.change(screen.getByLabelText(/record main salary/i), { target: { value: '4000' } })

  // switch to itemized, add two payments
  fireEvent.click(screen.getByRole('button', { name: /^itemized$/i }))
  fireEvent.click(screen.getByRole('button', { name: /\+ add payment/i }))
  fireEvent.change(screen.getByLabelText(/payment amount 1/i), { target: { value: '1000' } })
  fireEvent.click(screen.getByRole('button', { name: /\+ add payment/i }))
  fireEvent.change(screen.getByLabelText(/payment amount 2/i), { target: { value: '1110.80' } })

  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: /record as actual/i }))
  })

  await waitFor(() => {
    const pt = hookRef.current.year.monthOverrides['2026-04'].partTime
    expect(pt).toHaveLength(2)
    expect(pt[0].amount).toBe(1000)
    expect(pt[1].amount).toBeCloseTo(1110.8, 2)
  })
})

test('clearing a recorded month reverts it to projected', async () => {
  const hookRef = { current: null }
  render(<Harness hookRef={hookRef} />)
  await waitFor(() => expect(hookRef.current?.year).toBeTruthy())

  fireEvent.change(screen.getByLabelText(/record month/i), { target: { value: '2026-05' } })
  fireEvent.change(screen.getByLabelText(/record main salary/i), { target: { value: '4500' } })
  fireEvent.change(screen.getByLabelText(/record pcb/i), { target: { value: '80' } })
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: /record as actual/i }))
  })
  await waitFor(() => expect(hookRef.current.year.monthOverrides['2026-05']).toBeTruthy())

  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: /clear .*revert/i }))
  })

  await waitFor(() => {
    expect(hookRef.current.year.monthOverrides['2026-05']).toBeUndefined()
    expect(hookRef.current.year.pcbPaid.find((p) => p.month === '2026-05')).toBeUndefined()
  })
})
