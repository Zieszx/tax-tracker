import { renderHook, act } from '@testing-library/react'
import { VaultProvider, useVault } from './useVault.jsx'
import { blankAppData } from '../state/appData.js'

beforeEach(() => localStorage.clear())

// Helper: render the hook inside a VaultProvider
const wrapper = ({ children }) => <VaultProvider>{children}</VaultProvider>

test('initial status is empty when localStorage is clean', () => {
  const { result } = renderHook(() => useVault(), { wrapper })
  expect(result.current.status).toBe('empty')
  expect(result.current.hasVault).toBe(false)
  expect(result.current.data).toBeNull()
})

test('createVault sets status to unlocked with schemaVersion 2', async () => {
  const { result } = renderHook(() => useVault(), { wrapper })
  await act(async () => {
    await result.current.createVault('pass1234', blankAppData())
  })
  expect(result.current.status).toBe('unlocked')
  expect(result.current.data.schemaVersion).toBe(2)
  expect(result.current.hasVault).toBe(true)
})

test('lock transitions to locked and clears data', async () => {
  const { result } = renderHook(() => useVault(), { wrapper })
  await act(async () => {
    await result.current.createVault('pass1234', blankAppData())
  })
  act(() => {
    result.current.lock()
  })
  expect(result.current.status).toBe('locked')
  expect(result.current.data).toBeNull()
})

test('unlock with correct passcode returns true and restores unlocked status', async () => {
  const { result } = renderHook(() => useVault(), { wrapper })
  await act(async () => {
    await result.current.createVault('pass1234', blankAppData())
  })
  act(() => { result.current.lock() })
  let ok
  await act(async () => {
    ok = await result.current.unlock('pass1234')
  })
  expect(ok).toBe(true)
  expect(result.current.status).toBe('unlocked')
  expect(result.current.data.schemaVersion).toBe(2)
})

test('unlock with wrong passcode returns false and stays locked', async () => {
  const { result } = renderHook(() => useVault(), { wrapper })
  await act(async () => {
    await result.current.createVault('pass1234', blankAppData())
  })
  act(() => { result.current.lock() })
  let ok
  await act(async () => {
    ok = await result.current.unlock('nope')
  })
  expect(ok).toBe(false)
  expect(result.current.status).toBe('locked')
  expect(result.current.data).toBeNull()
})

test('save persists data that survives lock/unlock cycle', async () => {
  const { result } = renderHook(() => useVault(), { wrapper })
  await act(async () => {
    await result.current.createVault('pass1234', blankAppData())
  })
  await act(async () => {
    await result.current.save(d => ({ ...d, activeYear: 2027 }))
  })
  act(() => { result.current.lock() })
  await act(async () => {
    await result.current.unlock('pass1234')
  })
  expect(result.current.data.activeYear).toBe(2027)
})

test('resetApp removes vault and resets to empty', async () => {
  const { result } = renderHook(() => useVault(), { wrapper })
  await act(async () => {
    await result.current.createVault('pass1234', blankAppData())
  })
  act(() => { result.current.resetApp() })
  expect(result.current.status).toBe('empty')
  expect(result.current.hasVault).toBe(false)
  expect(localStorage.getItem('tax-vault-v2')).toBeNull()
})

test('settings shortcut returns the settings object when unlocked', async () => {
  const { result } = renderHook(() => useVault(), { wrapper })
  await act(async () => {
    await result.current.createVault('pass1234', blankAppData())
  })
  expect(result.current.settings).toMatchObject({ theme: 'system', autoLockMinutes: 5 })
})

test('changePasscode re-encrypts and new passcode unlocks', async () => {
  const { result } = renderHook(() => useVault(), { wrapper })
  await act(async () => {
    await result.current.createVault('pass1234', blankAppData())
  })
  let ok
  await act(async () => {
    ok = await result.current.changePasscode('pass1234', 'newpass99')
  })
  expect(ok).toBe(true)
  act(() => { result.current.lock() })
  await act(async () => {
    ok = await result.current.unlock('newpass99')
  })
  expect(ok).toBe(true)
  expect(result.current.status).toBe('unlocked')
})

test('changePasscode with wrong old passcode returns false', async () => {
  const { result } = renderHook(() => useVault(), { wrapper })
  await act(async () => {
    await result.current.createVault('pass1234', blankAppData())
  })
  let ok
  await act(async () => {
    ok = await result.current.changePasscode('wrongold', 'newpass99')
  })
  expect(ok).toBe(false)
  expect(result.current.status).toBe('unlocked')
})

test('exportPlain returns a JSON string of the decrypted data', async () => {
  const { result } = renderHook(() => useVault(), { wrapper })
  await act(async () => {
    await result.current.createVault('pass1234', blankAppData())
  })
  const plain = result.current.exportPlain()
  expect(typeof plain).toBe('string')
  const parsed = JSON.parse(plain)
  expect(parsed.schemaVersion).toBe(2)
})

test('save throws when vault is locked', async () => {
  const { result } = renderHook(() => useVault(), { wrapper })
  await act(async () => {
    await result.current.createVault('pass1234', blankAppData())
  })
  act(() => { result.current.lock() })
  await expect(
    act(async () => { await result.current.save(d => d) })
  ).rejects.toThrow()
})
