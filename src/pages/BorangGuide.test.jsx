import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { VaultProvider, useVault } from '../security/useVault.jsx'
import { ProfileProvider } from '../hooks/useProfile.js'
import BorangGuide from './BorangGuide.jsx'
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
    <MemoryRouter>
      <VaultProvider>
        <VaultSeeder>
          <ProfileProvider>{ui}</ProfileProvider>
        </VaultSeeder>
      </VaultProvider>
    </MemoryRouter>
  )
}

test('shows expanded sections: documents, Bahagian B, deadline, JomPAY, late penalties, Umiii', async () => {
  render(wrap(<BorangGuide />))

  await waitFor(() => expect(screen.getByRole('heading', { name: /Borang BE e-Filing Guide/i })).toBeInTheDocument())

  // Deadline
  expect(screen.getAllByText(/30 April 2027/i).length).toBeGreaterThan(0)

  // Documents to prepare section
  expect(screen.getByText(/Documents to prepare/i)).toBeInTheDocument()

  // Bahagian B step
  expect(screen.getAllByText(/Bahagian B/i).length).toBeGreaterThan(0)

  // Payment section — JomPAY
  expect(screen.getAllByText(/JomPAY/i).length).toBeGreaterThan(0)

  // Late penalties
  expect(screen.getAllByText(/late/i).length).toBeGreaterThan(0)

  // Umiii special note
  expect(screen.getAllByText(/Umiii/i).length).toBeGreaterThan(0)

  // Settings link for data management
  expect(screen.getAllByText(/Settings/i).length).toBeGreaterThan(0)
})

test('shows live result figures in the filing steps', async () => {
  render(wrap(<BorangGuide />))

  await waitFor(() => expect(screen.getByRole('heading', { name: /Borang BE e-Filing Guide/i })).toBeInTheDocument())

  // The live gross figure should show the seeded totalGross (~72.5k, not a dash '—')
  // defaultProfile seeded via migrateV1 produces totalGross between RM 68,000 and RM 78,000
  // We expect a formatted RM figure with digits — e.g. "RM 72,540.00"
  await waitFor(() => {
    const rmCells = screen.getAllByText(/RM\s[\d,]+\.\d{2}/)
    expect(rmCells.length).toBeGreaterThan(0)
    // At least one RM figure should represent the totalGross (>= 68000)
    const amounts = rmCells.map(el =>
      parseFloat(el.textContent.replace(/[^0-9.]/g, ''))
    )
    expect(amounts.some(a => a >= 68000 && a <= 78000)).toBe(true)
  })
})
