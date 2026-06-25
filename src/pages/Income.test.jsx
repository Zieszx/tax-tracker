/**
 * Income.test.jsx — Task 3.1: SourceCard + Income page
 *
 * TDD: written BEFORE the implementation to drive the design.
 * Tests the new Income page (side-by-side source cards + override log).
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

test('renders existing source cards (Main + Nuvera) from migrated data', async () => {
  render(wrap(<Income />))
  // Wait for vault to unlock and cards to appear
  await waitFor(() => {
    // page title "Income" must be there
    expect(screen.getByRole('heading', { level: 2, name: /^income$/i })).toBeInTheDocument()
  })

  // migrateV1 seeds two sources: "Main employer" and "Nuvera"
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

  // The sources grid should carry the class that enables 2-col layout
  await waitFor(() => {
    const grid = document.querySelector('.sources-grid')
    expect(grid).not.toBeNull()
  })
})

test('add a new part-time source adds a third card', async () => {
  render(wrap(<Income />))
  await waitFor(() =>
    expect(screen.getByDisplayValue(/Main employer/i)).toBeInTheDocument()
  )

  // Initially 2 source name inputs
  await waitFor(() => {
    expect(screen.getAllByLabelText(/source name/i).length).toBe(2)
  })

  const addBtn = screen.getByRole('button', { name: /add.*source/i })
  await act(async () => { fireEvent.click(addBtn) })

  // Should now have 3 source name inputs
  await waitFor(() => {
    const nameInputs = screen.getAllByLabelText(/source name/i)
    expect(nameInputs.length).toBe(3)
  })
})

test('editing main monthlyGross updates projected annual gross value', async () => {
  // Use projectionData: single main source, NO month overrides — so source projection drives annualGross
  render(wrap(<Income />, projectionData))
  await waitFor(() =>
    expect(screen.getByDisplayValue(/Test Corp/i)).toBeInTheDocument()
  )

  // The projected annual gross value element — initially 3000 * 12 = 36,000
  await waitFor(() => {
    expect(document.querySelector('.income-annual-value')).not.toBeNull()
  })
  const before = document.querySelector('.income-annual-value').textContent
  // Confirm it starts at RM 36,000.00
  expect(before).toMatch(/36,000/)

  // Change monthly gross from 3000 to 5000 (annual = 60,000)
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

test('overriding a month part-time updates projected annual gross', async () => {
  // projectionData: single main source (3000/mo = 36,000), no part-time
  render(wrap(<Income />, projectionData))
  await waitFor(() =>
    expect(screen.getByDisplayValue(/Test Corp/i)).toBeInTheDocument()
  )
  await waitFor(() => {
    expect(document.querySelector('.income-annual-value').textContent).toMatch(/36,000/)
  })

  // Override January part-time to 500 → annual gross becomes 36,500
  const partInput = screen.getByLabelText(/override part-time 2026-01/i)
  await act(async () => {
    fireEvent.change(partInput, { target: { value: '500' } })
    await new Promise((r) => setTimeout(r, 50))
  })

  await waitFor(
    () => {
      expect(document.querySelector('.income-annual-value').textContent).toMatch(/36,500/)
    },
    { timeout: 3000 }
  )
})

test('override log shows Actual/Projected status (confirmed month → Actual)', async () => {
  const withActual = {
    ...projectionData,
    years: {
      2026: {
        ...projectionYear,
        monthOverrides: { '2026-02': { mainSalary: 4500, partTime: [], confirmed: true } },
      },
    },
  }
  render(wrap(<Income />, withActual))
  await waitFor(() =>
    expect(screen.getByText(/month override log/i)).toBeInTheDocument()
  )
  await waitFor(() => {
    // at least one Actual (the confirmed Feb) and Projected (the rest)
    expect(screen.getAllByText(/^Actual$/i).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/^Projected$/i).length).toBeGreaterThanOrEqual(1)
  })
})

test('override log shows materialized months (12 rows)', async () => {
  render(wrap(<Income />))
  await waitFor(() =>
    expect(screen.getByText(/month override log/i)).toBeInTheDocument()
  )

  // The override log should display 12 month rows
  await waitFor(() => {
    const monthRows = document.querySelectorAll('.override-row')
    expect(monthRows.length).toBe(12)
  })
})
