/**
 * Settings.test.jsx — Task 2.6
 *
 * Tests for the Settings page:
 *   1. Renders key sections: Change passcode, Auto-lock, Reset app, Export
 *   2. Changing auto-lock minutes persists via vault.save
 *   3. Change passcode: wrong old passcode shows error
 *   4. Change passcode: success path calls changePasscode
 *   5. Reset app: requires typed confirmation
 */

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { vi } from 'vitest'
import Settings from './Settings.jsx'

// ── mock useVault ──────────────────────────────────────────────────────────
vi.mock('../security/useVault.jsx', () => ({
  useVault: vi.fn(),
}))

// ── mock useProfile ────────────────────────────────────────────────────────
vi.mock('../hooks/useProfile.js', () => ({
  useProfile: vi.fn(),
}))

import { useVault } from '../security/useVault.jsx'
import { useProfile } from '../hooks/useProfile.js'

function makeVault(overrides = {}) {
  return {
    status: 'unlocked',
    data: {
      schemaVersion: 2,
      settings: { theme: 'system', autoLockMinutes: 5, onboarded: true },
      activeYear: 2026,
      years: {},
    },
    settings: { theme: 'system', autoLockMinutes: 5, onboarded: true },
    save: vi.fn().mockResolvedValue(undefined),
    lock: vi.fn(),
    changePasscode: vi.fn().mockResolvedValue(true),
    resetApp: vi.fn(),
    exportPlain: vi.fn().mockReturnValue('{}'),
    ...overrides,
  }
}

function makeProfile(overrides = {}) {
  return {
    profile: { income: { months: [] }, reliefs: [], pcbPaid: [], settings: {} },
    result: { totalGross: 0, balance: 0, isRefund: false },
    exportJson: vi.fn().mockReturnValue('{}'),
    importJson: vi.fn(),
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  useVault.mockReturnValue(makeVault())
  useProfile.mockReturnValue(makeProfile())
})

afterEach(() => {
  vi.restoreAllMocks()
})

// ── 1. Presence of key sections ────────────────────────────────────────────

test('renders Change passcode, Auto-lock, Reset app, Export sections', () => {
  render(<Settings />)

  // Headings — use getAllByText since the button and heading share the text
  expect(screen.getAllByText(/Change passcode/i).length).toBeGreaterThan(0)
  expect(screen.getAllByText(/Auto-lock/i).length).toBeGreaterThan(0)
  expect(screen.getAllByText(/Reset app/i).length).toBeGreaterThan(0)
  expect(screen.getAllByText(/Export/i).length).toBeGreaterThan(0)
})

// ── 2. Auto-lock minutes persists via vault.save ───────────────────────────

test('changing auto-lock minutes calls vault.save with updated value', async () => {
  const save = vi.fn().mockResolvedValue(undefined)
  useVault.mockReturnValue(makeVault({ save }))

  render(<Settings />)

  // The input has aria-label="Auto-lock minutes" — match exactly
  const input = screen.getByLabelText('Auto-lock minutes')
  fireEvent.change(input, { target: { value: '10' } })

  // Find and click Save auto-lock button
  const saveBtn = screen.getByRole('button', { name: /save auto-lock/i })
  await act(async () => {
    fireEvent.click(saveBtn)
  })

  await waitFor(() => {
    expect(save).toHaveBeenCalled()
  })

  // The updater passed to save should produce settings.autoLockMinutes === 10
  const updater = save.mock.calls[0][0]
  const result = updater({
    schemaVersion: 2,
    settings: { theme: 'system', autoLockMinutes: 5, onboarded: true },
    activeYear: 2026,
    years: {},
  })
  expect(result.settings.autoLockMinutes).toBe(10)
})

// ── 3. Change passcode: success ────────────────────────────────────────────

test('change passcode success: calls changePasscode and shows success message', async () => {
  const changePasscode = vi.fn().mockResolvedValue(true)
  useVault.mockReturnValue(makeVault({ changePasscode }))

  render(<Settings />)

  fireEvent.change(screen.getByLabelText(/current passcode/i), { target: { value: 'oldpass1' } })
  fireEvent.change(screen.getByLabelText(/^new passcode$/i), { target: { value: 'newpass1' } })
  fireEvent.change(screen.getByLabelText(/confirm new passcode/i), { target: { value: 'newpass1' } })

  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: /change passcode/i }))
  })

  await waitFor(() => {
    expect(changePasscode).toHaveBeenCalledWith('oldpass1', 'newpass1')
  })

  await waitFor(() => {
    expect(screen.getByText(/passcode changed/i)).toBeInTheDocument()
  })
})

// ── 4. Change passcode: failure ────────────────────────────────────────────

test('change passcode failure: shows error when changePasscode returns false', async () => {
  const changePasscode = vi.fn().mockResolvedValue(false)
  useVault.mockReturnValue(makeVault({ changePasscode }))

  render(<Settings />)

  fireEvent.change(screen.getByLabelText(/current passcode/i), { target: { value: 'wrongold' } })
  fireEvent.change(screen.getByLabelText(/^new passcode$/i), { target: { value: 'newpass1' } })
  fireEvent.change(screen.getByLabelText(/confirm new passcode/i), { target: { value: 'newpass1' } })

  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: /change passcode/i }))
  })

  await waitFor(() => {
    expect(screen.getByText(/incorrect.*passcode|current passcode.*wrong|passcode.*incorrect/i)).toBeInTheDocument()
  })
})

// ── 5. Change passcode: mismatched new passcodes ───────────────────────────

test('change passcode: mismatched new passcodes shows validation error', async () => {
  const changePasscode = vi.fn()
  useVault.mockReturnValue(makeVault({ changePasscode }))

  render(<Settings />)

  fireEvent.change(screen.getByLabelText(/current passcode/i), { target: { value: 'oldpass1' } })
  fireEvent.change(screen.getByLabelText(/^new passcode$/i), { target: { value: 'newpass1' } })
  fireEvent.change(screen.getByLabelText(/confirm new passcode/i), { target: { value: 'different' } })

  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: /change passcode/i }))
  })

  expect(screen.getByText(/do not match/i)).toBeInTheDocument()
  expect(changePasscode).not.toHaveBeenCalled()
})

// ── 6. Reset app: requires typed confirmation ──────────────────────────────

test('reset app: shows confirmation input and calls resetApp on correct input', async () => {
  const resetApp = vi.fn()
  useVault.mockReturnValue(makeVault({ resetApp }))

  render(<Settings />)

  // Click "Reset app" button to reveal confirmation
  const resetBtn = screen.getByRole('button', { name: /reset app/i })
  fireEvent.click(resetBtn)

  // Should show typed confirmation prompt
  const confirmInput = await screen.findByPlaceholderText(/type.*reset|reset.*confirm/i)
  fireEvent.change(confirmInput, { target: { value: 'RESET' } })

  const confirmBtn = screen.getByRole('button', { name: /confirm reset|yes.*wipe|wipe.*data|i understand/i })
  await act(async () => {
    fireEvent.click(confirmBtn)
  })

  expect(resetApp).toHaveBeenCalled()
})

test('reset app: does not call resetApp when typed text is wrong', async () => {
  const resetApp = vi.fn()
  useVault.mockReturnValue(makeVault({ resetApp }))

  render(<Settings />)

  const resetBtn = screen.getByRole('button', { name: /reset app/i })
  fireEvent.click(resetBtn)

  const confirmInput = await screen.findByPlaceholderText(/type.*reset|reset.*confirm/i)
  fireEvent.change(confirmInput, { target: { value: 'wrong' } })

  const confirmBtn = screen.getByRole('button', { name: /confirm reset|yes.*wipe|wipe.*data|i understand/i })
  await act(async () => {
    fireEvent.click(confirmBtn)
  })

  // resetApp should NOT be called since input is wrong
  expect(resetApp).not.toHaveBeenCalled()
})
