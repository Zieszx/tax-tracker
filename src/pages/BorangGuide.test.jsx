import { render, screen, waitFor } from '@testing-library/react'
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
    <VaultProvider>
      <VaultSeeder>
        <ProfileProvider>{ui}</ProfileProvider>
      </VaultSeeder>
    </VaultProvider>
  )
}

test('shows e-filing steps, deadline, and data controls', async () => {
  render(wrap(<BorangGuide />))
  await waitFor(() => expect(screen.getByText(/Borang BE/i)).toBeInTheDocument())
  expect(screen.getByText(/30 April 2027/i)).toBeInTheDocument()
  expect(screen.getByText(/Export/i)).toBeInTheDocument()
  expect(screen.getByText(/Reset to my 2026 data/i)).toBeInTheDocument()
})
