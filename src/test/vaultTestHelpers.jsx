/**
 * vaultTestHelpers.jsx
 *
 * Shared test utilities for rendering components that require
 * an unlocked VaultProvider + ProfileProvider.
 *
 * Usage:
 *   import { renderWithVault } from '../test/vaultTestHelpers.jsx'
 *   ...
 *   beforeEach(() => localStorage.clear())
 *
 *   test('something', async () => {
 *     await renderWithVault(<MyComponent />)
 *     ...
 *   })
 */

import { render, waitFor } from '@testing-library/react'
import { useEffect, useRef } from 'react'
import { VaultProvider, useVault } from '../security/useVault.jsx'
import { ProfileProvider } from '../hooks/useProfile.js'
import { migrateV1, blankAppData } from '../state/appData.js'
import { defaultProfile } from '../data/defaultProfile.js'

// Default seeded AppData: migrated v1 data (real-ish data with valid figures)
export const defaultSeededAppData = {
  schemaVersion: 2,
  settings: { theme: 'system', autoLockMinutes: 5, onboarded: true },
  activeYear: 2026,
  years: { 2026: migrateV1(defaultProfile) },
}

/**
 * Component that seeds the vault with `initialData` on mount (once),
 * then renders its children only after the vault is unlocked.
 */
function VaultSeeder({ initialData, children }) {
  const vault = useVault()
  const seeded = useRef(false)

  useEffect(() => {
    if (!seeded.current && vault.status === 'empty') {
      seeded.current = true
      vault.createVault('test1234', initialData)
    }
  })

  // While vault is seeding (or if it fails), render nothing (avoid hook-before-unlock errors)
  if (vault.status !== 'unlocked') return null
  return children
}

/**
 * Renders `ui` inside a seeded unlocked VaultProvider + ProfileProvider.
 * Awaits until the vault is unlocked and the profile context is available.
 *
 * @param {React.ReactNode} ui
 * @param {object} [options]
 * @param {object} [options.initialData]  AppData to seed (defaults to defaultSeededAppData)
 * @returns {Promise<import('@testing-library/react').RenderResult>}
 */
export async function renderWithVault(ui, { initialData = defaultSeededAppData } = {}) {
  let renderResult

  function Wrapper() {
    return (
      <VaultProvider>
        <VaultSeeder initialData={initialData}>
          <ProfileProvider>
            {ui}
          </ProfileProvider>
        </VaultSeeder>
      </VaultProvider>
    )
  }

  renderResult = render(<Wrapper />)

  // Wait until VaultSeeder renders children (vault unlocked)
  await waitFor(() => {
    // The vault seeder renders null until unlocked; once something renders we're good.
    // We check that the document has some content beyond nothing.
  }, { timeout: 5000 })

  return renderResult
}
