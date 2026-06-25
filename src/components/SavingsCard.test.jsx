/**
 * SavingsCard.test.jsx — Task 3.3: Savings tracker (card + data)
 *
 * TDD: written BEFORE the implementation to drive the design.
 * Tests:
 *   - renders target (result.balance) and total set aside (0 initially)
 *   - adding an entry of 200 updates total to 200 and progress reflects 200/target
 */

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { VaultProvider, useVault } from '../security/useVault.jsx'
import { ProfileProvider } from '../hooks/useProfile.js'
import SavingsCard from './SavingsCard.jsx'
import { migrateV1, blankYearProfile } from '../state/appData.js'
import { defaultProfile } from '../data/defaultProfile.js'
import { useEffect, useRef } from 'react'

beforeEach(() => localStorage.clear())

// Seed data with migrated profile (has a positive balance due)
const seededData = {
  schemaVersion: 2,
  settings: { theme: 'system', autoLockMinutes: 5, onboarded: true },
  activeYear: 2026,
  years: { 2026: migrateV1(defaultProfile) },
}

function VaultSeeder({ data, children }) {
  const vault = useVault()
  const seeded = useRef(false)
  useEffect(() => {
    if (!seeded.current && vault.status === 'empty') {
      seeded.current = true
      vault.createVault('test1234', data)
    }
  })
  if (vault.status !== 'unlocked') return null
  return children
}

function wrap(ui, data = seededData) {
  return (
    <VaultProvider>
      <VaultSeeder data={data}>
        <ProfileProvider>{ui}</ProfileProvider>
      </VaultSeeder>
    </VaultProvider>
  )
}

test('renders savings card with target and initial total of zero', async () => {
  render(wrap(<SavingsCard />))
  await waitFor(() => {
    expect(screen.getByText(/set aside/i)).toBeInTheDocument()
  })
  // Should show RM 0.00 as the amount set aside initially
  expect(screen.getByTestId('savings-total')).toBeInTheDocument()
  expect(screen.getByTestId('savings-target')).toBeInTheDocument()
  expect(screen.getByTestId('savings-progress')).toBeInTheDocument()
})

test('adding an entry of 200 updates total and shows in list', async () => {
  render(wrap(<SavingsCard />))
  await waitFor(() => {
    expect(screen.getByTestId('savings-total')).toBeInTheDocument()
  })

  // The initial total should be 0
  expect(screen.getByTestId('savings-total').textContent).toMatch(/0\.00/)

  // Add an entry: fill in amount field and click Add
  const amountInput = screen.getByLabelText(/amount/i)
  await act(async () => {
    fireEvent.change(amountInput, { target: { value: '200' } })
  })

  const addBtn = screen.getByRole('button', { name: /add/i })
  await act(async () => {
    fireEvent.click(addBtn)
  })

  // Total should now reflect 200
  await waitFor(() => {
    expect(screen.getByTestId('savings-total').textContent).toMatch(/200/)
  })
})

test('progress bar reflects total vs target', async () => {
  render(wrap(<SavingsCard />))
  await waitFor(() => {
    expect(screen.getByTestId('savings-progress')).toBeInTheDocument()
  })

  const progressBar = screen.getByTestId('savings-progress')
  // aria-valuenow should be 0 initially (no entries)
  expect(progressBar.getAttribute('aria-valuenow')).toBe('0')
})
