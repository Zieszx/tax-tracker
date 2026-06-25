/**
 * Lock.test.jsx — Task 2.2
 *
 * Strategy: mock useVault to keep tests fast and isolated from crypto.
 * We test:
 *   1. Wrong passcode → shows "Incorrect passcode."
 *   2. Correct passcode → unlock resolves true and error is cleared.
 *   3. Reset link with confirm → calls resetApp().
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import Lock from './Lock.jsx'

// ── mock useVault ──────────────────────────────────────────────────────────
vi.mock('../security/useVault.jsx', () => ({
  useVault: vi.fn(),
}))

import { useVault } from '../security/useVault.jsx'

// helper that builds a mock vault context
function makeVault(overrides = {}) {
  return {
    status: 'locked',
    unlock: vi.fn().mockResolvedValue(false),
    resetApp: vi.fn(),
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  // default: vault that always returns false (wrong passcode)
  useVault.mockReturnValue(makeVault())
  // suppress confirm() — return false by default
  vi.spyOn(window, 'confirm').mockReturnValue(false)
})

afterEach(() => {
  vi.restoreAllMocks()
})

test('shows Incorrect passcode message when unlock returns false', async () => {
  render(<Lock />)

  const input = screen.getByLabelText(/passcode/i)
  fireEvent.change(input, { target: { value: 'wrongpass' } })
  fireEvent.click(screen.getByRole('button', { name: /unlock/i }))

  await waitFor(() => {
    expect(screen.getByText(/incorrect passcode/i)).toBeInTheDocument()
  })
})

test('clears error when unlock returns true (correct passcode)', async () => {
  // First call returns false, second returns true
  const unlockMock = vi.fn()
    .mockResolvedValueOnce(false)
    .mockResolvedValueOnce(true)
  useVault.mockReturnValue(makeVault({ unlock: unlockMock }))

  render(<Lock />)

  const input = screen.getByLabelText(/passcode/i)

  // Wrong attempt
  fireEvent.change(input, { target: { value: 'wrongpass' } })
  fireEvent.click(screen.getByRole('button', { name: /unlock/i }))
  await waitFor(() => expect(screen.getByText(/incorrect passcode/i)).toBeInTheDocument())

  // Correct attempt
  fireEvent.change(input, { target: { value: 'correctpass' } })
  fireEvent.click(screen.getByRole('button', { name: /unlock/i }))
  await waitFor(() => {
    expect(screen.queryByText(/incorrect passcode/i)).not.toBeInTheDocument()
  })
  expect(unlockMock).toHaveBeenCalledTimes(2)
  expect(unlockMock).toHaveBeenLastCalledWith('correctpass')
})

test('reset link with confirm calls resetApp', async () => {
  const resetApp = vi.fn()
  useVault.mockReturnValue(makeVault({ resetApp }))
  window.confirm.mockReturnValue(true)

  render(<Lock />)

  const resetLink = screen.getByRole('button', { name: /reset app/i })
  fireEvent.click(resetLink)

  expect(window.confirm).toHaveBeenCalled()
  expect(resetApp).toHaveBeenCalled()
})

test('reset link without confirm does NOT call resetApp', async () => {
  const resetApp = vi.fn()
  useVault.mockReturnValue(makeVault({ resetApp }))
  window.confirm.mockReturnValue(false)   // user cancels

  render(<Lock />)

  fireEvent.click(screen.getByRole('button', { name: /reset app/i }))

  expect(resetApp).not.toHaveBeenCalled()
})
