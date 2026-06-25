import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { VaultProvider, useVault } from '../security/useVault.jsx'
import { ProfileProvider } from '../hooks/useProfile.js'
import IncomeLog from './IncomeLog.jsx'
import { migrateV1 } from '../state/appData.js'
import { defaultProfile } from '../data/defaultProfile.js'
import { useEffect, useRef } from 'react'

beforeEach(() => localStorage.clear())

const seededData = {
  schemaVersion: 2,
  settings: { theme: 'system', autoLockMinutes: 5, onboarded: true },
  activeYear: 2026,
  years: { 2026: migrateV1(defaultProfile) },
}

function VaultSeeder({ children }) {
  const vault = useVault()
  const seeded = useRef(false)
  useEffect(() => {
    if (!seeded.current && vault.status === 'empty') {
      seeded.current = true
      vault.createVault('test1234', seededData)
    }
  })
  if (vault.status !== 'unlocked') return null
  return children
}

function wrap(ui) {
  return (
    <VaultProvider>
      <VaultSeeder>
        <ProfileProvider>{ui}</ProfileProvider>
      </VaultSeeder>
    </VaultProvider>
  )
}

test('editing a main salary updates the running total', async () => {
  render(wrap(<IncomeLog />))

  // Wait for the vault to unlock and profile to render
  await waitFor(() => expect(screen.getAllByLabelText(/main salary/i).length).toBeGreaterThan(0))

  const firstInput = screen.getAllByLabelText(/main salary/i)[0]
  const beforeTotal = screen.getByText(/Grand total income/i).textContent

  // Fire the change and await vault save (async) to complete
  await act(async () => {
    fireEvent.change(firstInput, { target: { value: '5000' } })
  })

  // After save, the input value and running total should reflect the new value
  await waitFor(() => {
    expect(screen.getAllByLabelText(/main salary/i)[0].value).toBe('5000')
  })

  // The running total must have changed
  const afterTotal = screen.getByText(/Grand total income/i).textContent
  expect(afterTotal).not.toBe(beforeTotal)
  expect(afterTotal).toMatch(/Grand total income/i)
})
