import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { VaultProvider, useVault } from '../security/useVault.jsx'
import { ProfileProvider } from '../hooks/useProfile.js'
import Reliefs from './Reliefs.jsx'
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

test('lists reliefs and allows editing an amount in isolation', async () => {
  render(wrap(<Reliefs />))
  await waitFor(() => expect(screen.getByText(/Personal relief/i)).toBeInTheDocument())

  const lifestyleBefore = screen.getByLabelText(/lifestyle .* amount/i).value

  const sspn = screen.getByLabelText(/SSPN net deposit amount/i)
  await act(async () => {
    fireEvent.change(sspn, { target: { value: '8000' } })
  })

  // Wait for vault save to complete and input to reflect new value
  await waitFor(() => {
    expect(screen.getByLabelText(/SSPN net deposit amount/i).value).toBe('8000')
  })

  // Edit is isolated: another relief's input is unchanged.
  expect(screen.getByLabelText(/lifestyle .* amount/i).value).toBe(lifestyleBefore)
})

test('auto relief input is disabled', async () => {
  render(wrap(<Reliefs />))
  await waitFor(() => expect(screen.getByLabelText(/personal relief amount/i)).toBeInTheDocument())
  expect(screen.getByLabelText(/personal relief amount/i)).toBeDisabled()
})

test('shows a what-if hint for a relief with headroom', async () => {
  render(wrap(<Reliefs />))
  await waitFor(() => expect(screen.getAllByText(/Top up to/i).length).toBeGreaterThan(0))

  const hints = screen.getAllByText(/Top up to/i)
  // The SSPN hint (limit RM 8,000.00) is present specifically.
  const sspnHint = hints.find((el) => el.textContent.includes('8,000.00'))
  expect(sspnHint).toBeInTheDocument()
  expect(sspnHint.textContent).toMatch(/save about/i)
})
