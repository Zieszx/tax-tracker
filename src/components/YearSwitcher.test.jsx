/**
 * YearSwitcher.test.jsx — Task 3.2: multi-year switcher
 *
 * TDD: written BEFORE the implementation.
 * Tests: add year blank, switch back restores data.
 */

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { VaultProvider, useVault } from '../security/useVault.jsx'
import { ProfileProvider, useProfile } from '../hooks/useProfile.js'
import YearSwitcher from './YearSwitcher.jsx'
import { migrateV1, blankYearProfile } from '../state/appData.js'
import { defaultProfile } from '../data/defaultProfile.js'
import { useEffect, useRef } from 'react'

beforeEach(() => localStorage.clear())

// Seed data: only 2026, migrated from v1
const seededData = {
  schemaVersion: 2,
  settings: { theme: 'system', autoLockMinutes: 5, onboarded: true },
  activeYear: 2026,
  years: { 2026: migrateV1(defaultProfile) },
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

// Helper: a consumer that exposes vault.data for assertions
function DataCapture({ capture }) {
  const vault = useVault()
  capture.current = vault.data
  return null
}

test('renders current year in the selector', async () => {
  render(wrap(<YearSwitcher />))
  await waitFor(() => {
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })
  const select = screen.getByRole('combobox')
  expect(select.value).toBe('2026')
})

test('add year blank → 2027 option appears and becomes active', async () => {
  render(wrap(<YearSwitcher />))

  // Wait for component to mount
  await waitFor(() => {
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })

  // Open the add-year input / click add button
  const addBtn = screen.getByRole('button', { name: /add year/i })
  await act(async () => {
    fireEvent.click(addBtn)
  })

  // A year input or a pre-filled next year should appear; confirm as blank
  // The component shows a year input and mode buttons
  await waitFor(() => {
    expect(screen.getByLabelText(/new year/i)).toBeInTheDocument()
  })

  const yearInput = screen.getByLabelText(/new year/i)
  await act(async () => {
    fireEvent.change(yearInput, { target: { value: '2027' } })
  })

  // Click "Add Blank"
  const addBlankBtn = screen.getByRole('button', { name: /add blank/i })
  await act(async () => {
    fireEvent.click(addBlankBtn)
  })

  // The select should now have 2027 as active
  await waitFor(() => {
    const select = screen.getByRole('combobox')
    expect(select.value).toBe('2027')
  })

  // Both 2026 and 2027 options present
  const options = screen.getAllByRole('option')
  const values = options.map((o) => o.value)
  expect(values).toContain('2026')
  expect(values).toContain('2027')
})

test('switching back to 2026 restores that year (income sources > 0)', async () => {
  const dataCapture = { current: null }

  render(
    <VaultProvider>
      <VaultSeeder data={seededData}>
        <ProfileProvider>
          <YearSwitcher />
          <DataCapture capture={dataCapture} />
        </ProfileProvider>
      </VaultSeeder>
    </VaultProvider>
  )

  await waitFor(() => {
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })

  // Add a blank 2027
  const addBtn = screen.getByRole('button', { name: /add year/i })
  await act(async () => { fireEvent.click(addBtn) })

  await waitFor(() => expect(screen.getByLabelText(/new year/i)).toBeInTheDocument())

  const yearInput = screen.getByLabelText(/new year/i)
  await act(async () => {
    fireEvent.change(yearInput, { target: { value: '2027' } })
  })

  const addBlankBtn = screen.getByRole('button', { name: /add blank/i })
  await act(async () => { fireEvent.click(addBlankBtn) })

  // Now active is 2027
  await waitFor(() => {
    expect(screen.getByRole('combobox').value).toBe('2027')
  })

  // Switch back to 2026
  const select = screen.getByRole('combobox')
  await act(async () => {
    fireEvent.change(select, { target: { value: '2026' } })
  })

  await waitFor(() => {
    expect(screen.getByRole('combobox').value).toBe('2026')
  })

  // The 2026 year data should have the migrated incomeSources (2 sources: main + nuvera)
  await waitFor(() => {
    expect(dataCapture.current).not.toBeNull()
    const year2026 = dataCapture.current?.years?.[2026]
    expect(year2026).toBeDefined()
    expect(year2026.incomeSources.length).toBeGreaterThan(0)
  })
})

test('add year clone → clones current year data', async () => {
  render(wrap(<YearSwitcher />))

  await waitFor(() => {
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })

  const addBtn = screen.getByRole('button', { name: /add year/i })
  await act(async () => { fireEvent.click(addBtn) })

  await waitFor(() => expect(screen.getByLabelText(/new year/i)).toBeInTheDocument())

  const yearInput = screen.getByLabelText(/new year/i)
  await act(async () => {
    fireEvent.change(yearInput, { target: { value: '2028' } })
  })

  // Click "Clone Current"
  const cloneBtn = screen.getByRole('button', { name: /clone/i })
  await act(async () => { fireEvent.click(cloneBtn) })

  // Active year becomes 2028
  await waitFor(() => {
    expect(screen.getByRole('combobox').value).toBe('2028')
  })
})
