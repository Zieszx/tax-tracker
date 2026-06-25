/**
 * PrintSummary.test.jsx — Task 4.3
 *
 * Asserts:
 *  1. Renders the gross tax figure from the seeded result.
 *  2. Renders BE field labels (Bahagian B, Chargeable income, etc.).
 *  3. The wrapper has class "print-only" so it is hidden on screen.
 */

import { render, screen, waitFor } from '@testing-library/react'
import { VaultProvider, useVault } from '../security/useVault.jsx'
import { ProfileProvider } from '../hooks/useProfile.js'
import PrintSummary from './PrintSummary.jsx'
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

test('renders gross tax figure', async () => {
  render(wrap(<PrintSummary />))
  // The seeded data (migrateV1 defaultProfile) produces a non-zero grossTax.
  // Assert that the "Tax charged" label is present AND that the corresponding
  // amount cell contains an RM value (not the fallback '—').
  await waitFor(() => {
    expect(screen.getByText(/Tax charged/i)).toBeInTheDocument()
    // getAllByText finds the RM amount cell(s); at least one must match /RM \d/
    const amountCells = screen.getAllByText(/^RM [\d,]+\.\d{2}$/)
    expect(amountCells.length).toBeGreaterThan(0)
  })
})

test('renders BE field labels', async () => {
  render(wrap(<PrintSummary />))
  await waitFor(() => {
    expect(screen.getByText(/Bahagian B/i)).toBeInTheDocument()
    expect(screen.getByText(/Chargeable income/i)).toBeInTheDocument()
    expect(screen.getByText(/PCB.*paid|PCB \//i)).toBeInTheDocument()
    expect(screen.getByText(/Balance|Refund/i)).toBeInTheDocument()
  })
})

test('wrapper has class print-only so it is hidden on screen', async () => {
  const { container } = render(wrap(<PrintSummary />))
  // After the vault seeds and component mounts, the outermost div should have print-only
  await waitFor(() =>
    expect(container.querySelector('.print-only')).not.toBeNull()
  )
})
