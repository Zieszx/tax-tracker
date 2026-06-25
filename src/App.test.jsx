/**
 * App.test.jsx — Task 2.4
 *
 * Tests that App gates rendering based on vault status:
 *   - status:'empty'  → renders Onboarding
 *   - status:'locked' → renders Lock screen
 *   - status:'unlocked' → renders normal Nav + routes (Dashboard)
 */

import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'

// Mock useVault so we can control vault status without real crypto
vi.mock('./security/useVault.jsx', () => {
  const actual = {}
  return {
    VaultProvider: ({ children }) => children,
    useVault: vi.fn(),
  }
})

import { useVault } from './security/useVault.jsx'
import App from './App.jsx'

function renderApp() {
  return render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <App />
    </MemoryRouter>
  )
}

beforeEach(() => {
  localStorage.clear()
  vi.resetAllMocks()
})

test('status empty → shows onboarding', () => {
  useVault.mockReturnValue({
    status: 'empty',
    data: null,
    hasVault: false,
    settings: null,
    lock: vi.fn(),
  })
  renderApp()
  // Onboarding renders "Welcome to Tax Tracker"
  expect(screen.getByText(/Welcome to Tax Tracker/i)).toBeInTheDocument()
})

test('status locked → shows lock screen', () => {
  useVault.mockReturnValue({
    status: 'locked',
    data: null,
    hasVault: true,
    settings: null,
    lock: vi.fn(),
    unlock: vi.fn(),
    resetApp: vi.fn(),
  })
  renderApp()
  // Lock screen has "Enter your passcode to unlock"
  expect(screen.getByText(/Enter your passcode to unlock/i)).toBeInTheDocument()
})

test('status unlocked → shows nav with Dashboard link', () => {
  useVault.mockReturnValue({
    status: 'unlocked',
    data: { settings: { autoLockMinutes: 5, theme: 'system', onboarded: true }, activeYear: 2026, years: {}, schemaVersion: 2 },
    hasVault: true,
    settings: { autoLockMinutes: 5, theme: 'system', onboarded: true },
    lock: vi.fn(),
    unlock: vi.fn(),
    save: vi.fn(),
    resetApp: vi.fn(),
    exportPlain: vi.fn(),
    changePasscode: vi.fn(),
    createVault: vi.fn(),
  })
  renderApp()
  expect(screen.getAllByText(/Dashboard/i).length).toBeGreaterThan(0)
})
