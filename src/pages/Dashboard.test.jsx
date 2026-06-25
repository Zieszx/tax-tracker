import { render, screen, waitFor } from '@testing-library/react'
import { VaultProvider, useVault } from '../security/useVault.jsx'
import { ProfileProvider } from '../hooks/useProfile.js'
import Dashboard from './Dashboard.jsx'
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

test('shows hero balance and key stat labels', async () => {
  render(wrap(<Dashboard />))
  await waitFor(() => expect(screen.getByText(/Total Gross/i)).toBeInTheDocument())
  expect(screen.getByText(/Effective Rate/i)).toBeInTheDocument()
  // Hero card states either Balance Due or Refund
  expect(screen.getByText(/Balance Due|Refund/i)).toBeInTheDocument()
})
