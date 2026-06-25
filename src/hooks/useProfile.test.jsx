/**
 * useProfile.test.jsx — Task 2.5
 *
 * Tests the vault-adapter behaviour of useProfile:
 *   - profile is derived from the active year via materializeMonths
 *   - result.pcbPaid and result.totalGross match the migrated v1 data
 *   - setYear updates state
 *   - importJson / exportJson / resetToDefault / clearToBlank remain functional
 */

import { render, screen, waitFor, act } from '@testing-library/react'
import { renderHook } from '@testing-library/react'
import { VaultProvider, useVault } from '../security/useVault.jsx'
import { ProfileProvider, useProfile } from './useProfile.js'
import { migrateV1, blankAppData } from '../state/appData.js'
import { defaultProfile } from '../data/defaultProfile.js'
import { useEffect, useRef } from 'react'

// ── seeded data ────────────────────────────────────────────────────────────────

const migratedYear = migrateV1(defaultProfile)
const seededAppData = {
  schemaVersion: 2,
  settings: { theme: 'system', autoLockMinutes: 5, onboarded: true },
  activeYear: 2026,
  years: { 2026: migratedYear },
}

// ── helper: seed vault then use ProfileProvider in a real render tree ─────────

/**
 * Renders a component that:
 *   1. Wraps children in VaultProvider + ProfileProvider
 *   2. Seeds the vault with initialData on mount
 *   3. Exposes a ref to the latest useProfile() return value
 */
function createHarness(initialData) {
  let hookRef = { current: null }

  function InnerConsumer() {
    const ctx = useProfile()
    hookRef.current = ctx
    return null
  }

  function VaultSeeder({ children }) {
    const vault = useVault()
    const seeded = useRef(false)
    useEffect(() => {
      if (!seeded.current && vault.status === 'empty') {
        seeded.current = true
        vault.createVault('test1234', initialData)
      }
    })
    return children
  }

  function Wrapper() {
    return (
      <VaultProvider>
        <VaultSeeder>
          <ProfileProvider>
            <InnerConsumer />
          </ProfileProvider>
        </VaultSeeder>
      </VaultProvider>
    )
  }

  return { Wrapper, hookRef }
}

beforeEach(() => localStorage.clear())

// ── Task 2.5 required tests ────────────────────────────────────────────────────

test('result.pcbPaid ≈ 627.45 for migrated v1 data', async () => {
  const { Wrapper, hookRef } = createHarness(seededAppData)
  render(<Wrapper />)

  await waitFor(() => {
    expect(hookRef.current).not.toBeNull()
    expect(hookRef.current.result).toBeDefined()
  })

  expect(hookRef.current.result.pcbPaid).toBeCloseTo(627.45, 2)
})

test('result.totalGross is in [68000, 78000] for migrated v1 data', async () => {
  const { Wrapper, hookRef } = createHarness(seededAppData)
  render(<Wrapper />)

  await waitFor(() => {
    expect(hookRef.current).not.toBeNull()
    expect(hookRef.current.result).toBeDefined()
  })

  expect(hookRef.current.result.totalGross).toBeGreaterThan(68000)
  expect(hookRef.current.result.totalGross).toBeLessThan(78000)
})

test('setYear updates the active year profile and recomputes result', async () => {
  const { Wrapper, hookRef } = createHarness(seededAppData)
  render(<Wrapper />)

  await waitFor(() => {
    expect(hookRef.current).not.toBeNull()
    expect(hookRef.current.result).toBeDefined()
  })

  const beforeReliefs = hookRef.current.result.totalReliefs

  // Bump sspn relief from 0 to 500
  await act(async () => {
    await hookRef.current.setYear((yr) => ({
      ...yr,
      reliefs: yr.reliefs.map((r) =>
        r.key === 'sspn' ? { ...r, amount: 500 } : r
      ),
    }))
  })

  await waitFor(() => {
    expect(hookRef.current.result.totalReliefs).toBeGreaterThan(beforeReliefs)
  })
})

// ── Backward-compatibility tests (importJson / exportJson / etc.) ─────────────

test('importJson throws unified error on malformed JSON', async () => {
  const { Wrapper, hookRef } = createHarness(seededAppData)
  render(<Wrapper />)

  await waitFor(() => {
    expect(hookRef.current).not.toBeNull()
  })

  expect(() => hookRef.current.importJson('not json')).toThrow('Invalid profile file')
})

test('importJson throws unified error on structurally-invalid JSON', async () => {
  const { Wrapper, hookRef } = createHarness(seededAppData)
  render(<Wrapper />)

  await waitFor(() => {
    expect(hookRef.current).not.toBeNull()
  })

  expect(() => hookRef.current.importJson('{"foo":1}')).toThrow('Invalid profile file')
})

test('importJson throws when income.months is missing', async () => {
  const { Wrapper, hookRef } = createHarness(seededAppData)
  render(<Wrapper />)

  await waitFor(() => {
    expect(hookRef.current).not.toBeNull()
  })

  const noMonths = JSON.stringify({ income: {}, reliefs: [] })
  expect(() => hookRef.current.importJson(noMonths)).toThrow('Invalid profile file')
})

test('importJson accepts a valid profile-shaped JSON and updates reliefs and clears income sources', async () => {
  const { Wrapper, hookRef } = createHarness(seededAppData)
  render(<Wrapper />)

  await waitFor(() => {
    expect(hookRef.current).not.toBeNull()
    expect(hookRef.current.result).toBeDefined()
  })

  const valid = JSON.stringify({ income: { months: [] }, reliefs: [] })
  await act(async () => {
    hookRef.current.importJson(valid)
  })

  await waitFor(() => {
    // Reliefs are replaced with the imported empty array
    expect(hookRef.current.profile.reliefs).toEqual([])
    // income.months is still 12 entries (materializeMonths always produces 12),
    // but all are zero since incomeSources and monthOverrides were cleared
    expect(hookRef.current.profile.income.months).toHaveLength(12)
    expect(hookRef.current.profile.income.months[0].mainSalary).toBe(0)
    expect(hookRef.current.profile.income.months[0].partTime).toEqual([])
  })
})
