/**
 * Onboarding.test.jsx — Task 2.3
 *
 * Strategy: mock useVault so we can assert createVault was called correctly
 * without real crypto. Test the wizard flow:
 *   1. Welcome step → Next
 *   2. Passcode step → mismatch blocks, matching passcodes advance
 *   3. Data choice step → "start blank" → finish
 *   4. createVault called with AppData that has settings.onboarded === true
 *   5. Mismatched passcodes show error + block advance
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import Onboarding from './Onboarding.jsx'

// ── mock useVault ──────────────────────────────────────────────────────────
vi.mock('../security/useVault.jsx', () => ({
  useVault: vi.fn(),
}))

import { useVault } from '../security/useVault.jsx'

function makeVault(overrides = {}) {
  return {
    status: 'empty',
    createVault: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  useVault.mockReturnValue(makeVault())
  // No v1 data in localStorage
  localStorage.clear()
})

afterEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
})

// Helper: advance from welcome to passcode step
async function advancePastWelcome() {
  const nextBtn = screen.getByRole('button', { name: /next|get started|begin/i })
  fireEvent.click(nextBtn)
}

test('renders welcome step initially', () => {
  render(<Onboarding />)
  // Should show welcome content
  expect(screen.getByText(/welcome/i)).toBeInTheDocument()
})

test('mismatched passcodes show error and block advancing to step 3', async () => {
  render(<Onboarding />)

  // Step 1: welcome → next
  await advancePastWelcome()

  // Step 2: passcode entry
  const passInput = screen.getByLabelText(/^passcode$/i)
  const confirmInput = screen.getByLabelText(/confirm passcode/i)

  fireEvent.change(passInput, { target: { value: 'secret123' } })
  fireEvent.change(confirmInput, { target: { value: 'different9' } })

  // Try to advance
  const nextBtn = screen.getByRole('button', { name: /next/i })
  fireEvent.click(nextBtn)

  // Should show mismatch error
  expect(screen.getByText(/do not match/i)).toBeInTheDocument()
  // Should still be on passcode step (confirm input still visible)
  expect(screen.getByLabelText(/confirm passcode/i)).toBeInTheDocument()
})

test('passcode shorter than 6 chars shows error and blocks advance', async () => {
  render(<Onboarding />)

  await advancePastWelcome()

  const passInput = screen.getByLabelText(/^passcode$/i)
  const confirmInput = screen.getByLabelText(/confirm passcode/i)

  fireEvent.change(passInput, { target: { value: 'abc' } })
  fireEvent.change(confirmInput, { target: { value: 'abc' } })

  fireEvent.click(screen.getByRole('button', { name: /next/i }))

  expect(screen.getByText(/at least 6/i)).toBeInTheDocument()
})

test('full flow: welcome → passcode → start blank → createVault with onboarded=true', async () => {
  const createVault = vi.fn().mockResolvedValue(undefined)
  useVault.mockReturnValue(makeVault({ createVault }))

  render(<Onboarding />)

  // Step 1: welcome
  await advancePastWelcome()

  // Step 2: matching passcode
  const passInput = screen.getByLabelText(/^passcode$/i)
  const confirmInput = screen.getByLabelText(/confirm passcode/i)

  fireEvent.change(passInput, { target: { value: 'hunter2pass' } })
  fireEvent.change(confirmInput, { target: { value: 'hunter2pass' } })

  fireEvent.click(screen.getByRole('button', { name: /next/i }))

  // Step 3: data choice — choose "start blank"
  await waitFor(() => {
    expect(screen.getByRole('button', { name: /start blank/i })).toBeInTheDocument()
  })

  // Click "start blank"
  fireEvent.click(screen.getByRole('button', { name: /start blank/i }))

  // Should call createVault with an AppData that has settings.onboarded === true
  await waitFor(() => {
    expect(createVault).toHaveBeenCalledTimes(1)
  })

  const [calledPasscode, calledData] = createVault.mock.calls[0]
  expect(calledPasscode).toBe('hunter2pass')
  expect(calledData.settings.onboarded).toBe(true)
  expect(calledData.schemaVersion).toBe(2)
})

test('use sample data triggers createVault with migrated data', async () => {
  const createVault = vi.fn().mockResolvedValue(undefined)
  useVault.mockReturnValue(makeVault({ createVault }))

  render(<Onboarding />)

  await advancePastWelcome()

  const passInput = screen.getByLabelText(/^passcode$/i)
  const confirmInput = screen.getByLabelText(/confirm passcode/i)
  fireEvent.change(passInput, { target: { value: 'mypass99' } })
  fireEvent.change(confirmInput, { target: { value: 'mypass99' } })
  fireEvent.click(screen.getByRole('button', { name: /next/i }))

  await waitFor(() => {
    expect(screen.getByRole('button', { name: /use sample data/i })).toBeInTheDocument()
  })

  fireEvent.click(screen.getByRole('button', { name: /use sample data/i }))

  await waitFor(() => {
    expect(createVault).toHaveBeenCalledTimes(1)
  })

  const [, calledData] = createVault.mock.calls[0]
  expect(calledData.settings.onboarded).toBe(true)
  // Should have migrated default profile data (has incomeSources)
  expect(calledData.years[2026].incomeSources.length).toBeGreaterThan(0)
})

test('import v1 option shown when localStorage tax-profile-2026 exists', async () => {
  // Seed a v1 profile in localStorage
  const { defaultProfile } = await import('../data/defaultProfile.js')
  localStorage.setItem('tax-profile-2026', JSON.stringify(defaultProfile))

  render(<Onboarding />)

  await advancePastWelcome()

  const passInput = screen.getByLabelText(/^passcode$/i)
  const confirmInput = screen.getByLabelText(/confirm passcode/i)
  fireEvent.change(passInput, { target: { value: 'mypass99' } })
  fireEvent.change(confirmInput, { target: { value: 'mypass99' } })
  fireEvent.click(screen.getByRole('button', { name: /next/i }))

  await waitFor(() => {
    expect(screen.getByRole('button', { name: /import v1|import existing/i })).toBeInTheDocument()
  })
})
