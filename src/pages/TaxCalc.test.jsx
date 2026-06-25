import { render, screen, waitFor } from '@testing-library/react'
import { VaultProvider, useVault } from '../security/useVault.jsx'
import { ProfileProvider } from '../hooks/useProfile.js'
import { computeTax } from '../engine/tax.js'
import { defaultProfile } from '../data/defaultProfile.js'
import { migrateV1 } from '../state/appData.js'
import { materializeMonths } from '../state/materialize.js'
import { formatRM } from '../engine/format.js'
import TaxCalc from './TaxCalc.jsx'
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

test('renders breakdown and three scenario columns', async () => {
  render(wrap(<TaxCalc />))
  await waitFor(() => expect(screen.getByText(/Tax Breakdown/i)).toBeInTheDocument())
  expect(screen.getByText(/Main only/i)).toBeInTheDocument()
  expect(screen.getByText(/Main \+ part-time/i)).toBeInTheDocument()
  expect(screen.getByText(/Reliefs maxed/i)).toBeInTheDocument()
})

test('renders the computed gross tax figure for the migrated v1 profile', async () => {
  render(wrap(<TaxCalc />))
  await waitFor(() => expect(screen.getByText(/Tax Breakdown/i)).toBeInTheDocument())

  // Compute expected gross tax using the same pipeline as useProfile
  const yr = migrateV1(defaultProfile)
  const months = materializeMonths(yr.incomeSources, yr.monthOverrides, yr.taxYear ?? 2026)
  const engineProfile = {
    income: { months },
    reliefs: yr.reliefs,
    pcbPaid: yr.pcbPaid,
    settings: { taxBrackets: yr.taxBrackets },
  }
  const expected = formatRM(computeTax(engineProfile).grossTax)
  expect(screen.getAllByText(expected).length).toBeGreaterThan(0)
})
