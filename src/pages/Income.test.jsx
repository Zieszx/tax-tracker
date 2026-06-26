/**
 * Income.test.jsx — Task B4 update
 *
 * Tests for the tabbed Income page (Months / Sources / Import).
 * B4: MonthCards, MonthsSummary, bulk actions. Override-table tests removed.
 */

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { VaultProvider, useVault } from '../security/useVault.jsx'
import { ProfileProvider } from '../hooks/useProfile.js'
import Income from './Income.jsx'
import { migrateV1, blankYearProfile } from '../state/appData.js'
import { defaultProfile } from '../data/defaultProfile.js'
import { useEffect, useRef } from 'react'

beforeEach(() => localStorage.clear())

// For source-card-rendering tests: migrated data with 2 sources
const seededData = {
  schemaVersion: 2,
  settings: { theme: 'system', autoLockMinutes: 5, onboarded: true },
  activeYear: 2026,
  years: { 2026: migrateV1(defaultProfile) },
}

// For projection tests: a year profile with ONE main source and NO month overrides
// so editing monthlyGross directly affects the annualGross
const projectionYear = {
  ...blankYearProfile(2026),
  incomeSources: [
    {
      id: 'main-test',
      type: 'main',
      name: 'Test Corp',
      monthlyGross: 3000,
      monthsActive: { from: 1, to: 12 },
      autoStatutory: true,
    },
  ],
  monthOverrides: {},
}

const projectionData = {
  schemaVersion: 2,
  settings: { theme: 'system', autoLockMinutes: 5, onboarded: true },
  activeYear: 2026,
  years: { 2026: projectionYear },
}

// Data with one confirmed month
const withActualYear = {
  ...projectionYear,
  monthOverrides: { '2026-02': { mainSalary: 4500, partTime: [], confirmed: true } },
}
const withActualData = {
  schemaVersion: 2,
  settings: { theme: 'system', autoLockMinutes: 5, onboarded: true },
  activeYear: 2026,
  years: { 2026: withActualYear },
}

function VaultSeeder({ data, children }) {
  const vault = useVault()
  const seeded = useRef(false)
  useEffect(() => {
    if (!seeded.current && vault.status === 'empty') {
      seeded.current = true
      vault.createVault('test1234', data)
    }
  })
  if (vault.status !== 'unlocked') return null
  return children
}

function wrap(ui, data = seededData) {
  return (
    <VaultProvider>
      <VaultSeeder data={data}>
        <ProfileProvider>{ui}</ProfileProvider>
      </VaultSeeder>
    </VaultProvider>
  )
}

/** Helper: switch to the Sources tab */
async function switchToSources() {
  const sourcesTab = screen.getByRole('tab', { name: /sources/i })
  await act(async () => { fireEvent.click(sourcesTab) })
}

// ── Sources tab tests (unchanged) ────────────────────────────────────────────

test('renders existing source cards (Main + Nuvera) from migrated data', async () => {
  render(wrap(<Income />))
  await waitFor(() => {
    expect(screen.getByRole('heading', { level: 2, name: /^income$/i })).toBeInTheDocument()
  })

  await switchToSources()

  await waitFor(() => {
    expect(screen.getByDisplayValue(/Main employer/i)).toBeInTheDocument()
    expect(screen.getByDisplayValue(/Nuvera/i)).toBeInTheDocument()
  })
})

test('sources grid container has responsive class', async () => {
  render(wrap(<Income />))
  await waitFor(() => {
    expect(screen.getByRole('heading', { level: 2, name: /^income$/i })).toBeInTheDocument()
  })

  await switchToSources()

  await waitFor(() => {
    const grid = document.querySelector('.sources-grid')
    expect(grid).not.toBeNull()
  })
})

test('add a new part-time source adds a third card', async () => {
  render(wrap(<Income />))
  await waitFor(() =>
    expect(screen.getByRole('heading', { level: 2, name: /^income$/i })).toBeInTheDocument()
  )

  await switchToSources()

  await waitFor(() =>
    expect(screen.getByDisplayValue(/Main employer/i)).toBeInTheDocument()
  )

  await waitFor(() => {
    expect(screen.getAllByLabelText(/source name/i).length).toBe(2)
  })

  const addBtn = screen.getByRole('button', { name: /add.*source/i })
  await act(async () => { fireEvent.click(addBtn) })

  await waitFor(() => {
    const nameInputs = screen.getAllByLabelText(/source name/i)
    expect(nameInputs.length).toBe(3)
  })
})

test('editing main monthlyGross updates projected annual gross value (Sources tab)', async () => {
  render(wrap(<Income />, projectionData))

  await waitFor(() => {
    expect(screen.getByRole('heading', { level: 2, name: /^income$/i })).toBeInTheDocument()
  })
  await switchToSources()

  await waitFor(() =>
    expect(screen.getByDisplayValue(/Test Corp/i)).toBeInTheDocument()
  )

  await waitFor(() => {
    expect(document.querySelector('.income-annual-value')).not.toBeNull()
  })
  const before = document.querySelector('.income-annual-value').textContent
  expect(before).toMatch(/36,000/)

  const grossInput = screen.getByLabelText(/monthly gross/i)
  await act(async () => {
    fireEvent.change(grossInput, { target: { value: '5000' } })
    await new Promise((r) => setTimeout(r, 50))
  })

  await waitFor(
    () => {
      const after = document.querySelector('.income-annual-value').textContent
      expect(after).toMatch(/60,000/)
    },
    { timeout: 3000 }
  )
})

// ── Months tab: B4 tests ──────────────────────────────────────────────────────

test('Months panel shows 12 MonthCards', async () => {
  render(wrap(<Income />, projectionData))
  await waitFor(() =>
    expect(screen.getByRole('heading', { level: 2, name: /^income$/i })).toBeInTheDocument()
  )

  // Months tab is default
  await waitFor(() => {
    // MonthCard articles have aria-label "<MonthLabel> income card"
    const cards = document.querySelectorAll('.month-card')
    expect(cards.length).toBeGreaterThanOrEqual(12)
  })
})

test('MonthsSummary shows annual gross in the Months tab', async () => {
  // projectionData: 3000/mo * 12 = 36,000
  render(wrap(<Income />, projectionData))
  await waitFor(() =>
    expect(screen.getByRole('heading', { level: 2, name: /^income$/i })).toBeInTheDocument()
  )

  // MonthsSummary renders inside the Months panel (default tab)
  await waitFor(() => {
    const grossEl = screen.getByLabelText('annual gross')
    expect(grossEl.textContent).toMatch(/36,000/)
  })
})

test('editing a MonthCard main salary updates the summary annual gross', async () => {
  // projectionData: main = 3000/mo, 12 months = 36,000 annual
  render(wrap(<Income />, projectionData))
  await waitFor(() =>
    expect(screen.getByRole('heading', { level: 2, name: /^income$/i })).toBeInTheDocument()
  )

  // Wait for 12 month cards to render
  await waitFor(() => {
    expect(document.querySelectorAll('.month-card').length).toBeGreaterThanOrEqual(12)
  })

  // Grab the main salary input for 2026-01
  const mainInput = screen.getByLabelText('main salary 2026-01')
  await act(async () => {
    fireEvent.change(mainInput, { target: { value: '6000' } })
    await new Promise((r) => setTimeout(r, 50))
  })

  // Annual gross should now be 36,000 - 3,000 + 6,000 = 39,000
  await waitFor(
    () => {
      const grossEl = screen.getByLabelText('annual gross')
      expect(grossEl.textContent).toMatch(/39,000/)
    },
    { timeout: 3000 }
  )
})

test('status counts: MonthsSummary shows 1 actual when one month is confirmed', async () => {
  render(wrap(<Income />, withActualData))
  await waitFor(() =>
    expect(screen.getByRole('heading', { level: 2, name: /^income$/i })).toBeInTheDocument()
  )

  // Wait for MonthsSummary
  await waitFor(() => {
    const actualsEl = screen.getByLabelText('actual months count')
    // Should show "1" confirmed
    expect(actualsEl.textContent).toContain('1')
  })
})

test('MonthCards show Actual badge for confirmed months and Projected for others', async () => {
  render(wrap(<Income />, withActualData))
  await waitFor(() =>
    expect(screen.getByRole('heading', { level: 2, name: /^income$/i })).toBeInTheDocument()
  )

  await waitFor(() => {
    expect(document.querySelectorAll('.month-card').length).toBeGreaterThanOrEqual(12)
  })

  // At least one Actual badge and multiple Projected badges
  await waitFor(() => {
    const actualBadges = document.querySelectorAll('.month-card-badge-actual')
    const projectedBadges = document.querySelectorAll('.month-card-badge-projected')
    expect(actualBadges.length).toBeGreaterThanOrEqual(1)
    expect(projectedBadges.length).toBeGreaterThanOrEqual(1)
  })
})

test('bulk action applyMainToAll updates all months', async () => {
  render(wrap(<Income />, projectionData))
  await waitFor(() =>
    expect(screen.getByRole('heading', { level: 2, name: /^income$/i })).toBeInTheDocument()
  )

  // Wait for month cards
  await waitFor(() => {
    expect(document.querySelectorAll('.month-card').length).toBeGreaterThanOrEqual(12)
  })

  // Click the "Set main salary for all months" bulk action
  const bulkBtn = screen.getByRole('button', { name: /set main salary for all months/i })
  await act(async () => { fireEvent.click(bulkBtn) })

  // Fill in amount
  const amountInput = screen.getByLabelText(/bulk main salary amount/i)
  await act(async () => {
    fireEvent.change(amountInput, { target: { value: '5000' } })
  })

  // Click Preview
  const previewBtn = screen.getByRole('button', { name: /preview bulk action/i })
  await act(async () => { fireEvent.click(previewBtn) })

  // Confirm message should appear
  await waitFor(() => {
    const msg = document.querySelector('.bulk-action-confirm-msg')
    expect(msg).not.toBeNull()
    expect(msg.textContent).toMatch(/5,000/)
  })

  // Confirm
  const confirmBtn = screen.getByRole('button', { name: /confirm bulk action/i })
  await act(async () => { fireEvent.click(confirmBtn) })

  // Annual gross should now be 5000 * 12 = 60,000
  await waitFor(
    () => {
      const grossEl = screen.getByLabelText('annual gross')
      expect(grossEl.textContent).toMatch(/60,000/)
    },
    { timeout: 3000 }
  )
})
