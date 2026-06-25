/**
 * smoke.test.jsx
 *
 * Updated for Task 2.4: App now gates on vault status.
 * Mock useVault to return unlocked state so the nav + routes render.
 */

import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'

vi.mock('../security/useVault.jsx', () => ({
  VaultProvider: ({ children }) => children,
  useVault: vi.fn(() => ({
    status: 'unlocked',
    data: {
      schemaVersion: 2,
      settings: { autoLockMinutes: 5, theme: 'system', onboarded: true },
      activeYear: 2026,
      years: {},
    },
    hasVault: true,
    settings: { autoLockMinutes: 5, theme: 'system', onboarded: true },
    lock: vi.fn(),
    unlock: vi.fn(),
    save: vi.fn(),
    resetApp: vi.fn(),
    exportPlain: vi.fn(),
    changePasscode: vi.fn(),
    createVault: vi.fn(),
  })),
}))

import App from '../App.jsx'

test('renders app shell with nav brand and dashboard link', () => {
  render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <App />
    </MemoryRouter>
  )
  expect(screen.getAllByText('Dashboard').length).toBeGreaterThan(0)
  expect(screen.getByText('Income')).toBeInTheDocument()
})
