/**
 * useVault.jsx — encrypted in-memory AppData store.
 *
 * VaultProvider holds:
 *   - status: 'empty' | 'locked' | 'unlocked'
 *   - data: decrypted AppData (null when locked/empty)
 *   - The CryptoKey in a ref (never in state — avoids re-renders + keeps it off the serialisation path)
 *
 * localStorage key: 'tax-vault-v2'
 * Shape on disk: { v:2, salt:<base64>, iv:<base64>, ciphertext:<base64> }
 */

import { createContext, useContext, useRef, useState } from 'react'
import { generateSalt, deriveKey, encryptJSON, decryptJSON } from './crypto.js'

const STORAGE_KEY = 'tax-vault-v2'

// ─── helpers ────────────────────────────────────────────────────────────────

function toBase64(uint8) {
  return btoa(String.fromCharCode(...uint8))
}

function fromBase64(str) {
  return Uint8Array.from(atob(str), c => c.charCodeAt(0))
}

function readRaw() {
  const raw = localStorage.getItem(STORAGE_KEY)
  return raw ? JSON.parse(raw) : null
}

function writeRaw(v) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(v))
}

// ─── context ────────────────────────────────────────────────────────────────

const VaultContext = createContext(null)

export function VaultProvider({ children }) {
  const raw = readRaw()
  const initialStatus = raw ? 'locked' : 'empty'

  const [status, setStatus] = useState(initialStatus)
  const [data, setData] = useState(null)
  const keyRef = useRef(null)   // CryptoKey — never stored in React state

  // ── createVault ───────────────────────────────────────────────────────────
  async function createVault(passcode, initialData) {
    const salt = generateSalt()
    const key = await deriveKey(passcode, salt)
    const { iv, ciphertext } = await encryptJSON(initialData, key)
    writeRaw({ v: 2, salt: toBase64(salt), iv, ciphertext })
    keyRef.current = key
    setData(initialData)
    setStatus('unlocked')
  }

  // ── unlock ────────────────────────────────────────────────────────────────
  async function unlock(passcode) {
    const stored = readRaw()
    if (!stored) return false
    try {
      const salt = fromBase64(stored.salt)
      const key = await deriveKey(passcode, salt)
      const decrypted = await decryptJSON({ iv: stored.iv, ciphertext: stored.ciphertext }, key)
      keyRef.current = key
      setData(decrypted)
      setStatus('unlocked')
      return true
    } catch {
      return false
    }
  }

  // ── lock ──────────────────────────────────────────────────────────────────
  function lock() {
    keyRef.current = null
    setData(null)
    setStatus(readRaw() ? 'locked' : 'empty')
  }

  // ── save ──────────────────────────────────────────────────────────────────
  async function save(updater) {
    if (status !== 'unlocked' || !keyRef.current) {
      throw new Error('Vault is locked — cannot save')
    }
    const stored = readRaw()
    const next = updater(data)
    const { iv, ciphertext } = await encryptJSON(next, keyRef.current)
    writeRaw({ ...stored, iv, ciphertext })
    setData(next)
  }

  // ── changePasscode ────────────────────────────────────────────────────────
  async function changePasscode(oldPasscode, newPasscode) {
    const stored = readRaw()
    if (!stored) return false
    try {
      const salt = fromBase64(stored.salt)
      const oldKey = await deriveKey(oldPasscode, salt)
      // Verify old key decrypts successfully
      await decryptJSON({ iv: stored.iv, ciphertext: stored.ciphertext }, oldKey)
      // Re-encrypt current in-memory data with new passcode + new salt
      const newSalt = generateSalt()
      const newKey = await deriveKey(newPasscode, newSalt)
      const { iv: newIv, ciphertext: newCt } = await encryptJSON(data, newKey)
      writeRaw({ v: 2, salt: toBase64(newSalt), iv: newIv, ciphertext: newCt })
      keyRef.current = newKey
      return true
    } catch {
      return false
    }
  }

  // ── resetApp ──────────────────────────────────────────────────────────────
  function resetApp() {
    localStorage.removeItem(STORAGE_KEY)
    keyRef.current = null
    setData(null)
    setStatus('empty')
  }

  // ── exportPlain ───────────────────────────────────────────────────────────
  function exportPlain() {
    if (!data) throw new Error('Vault is locked — cannot export')
    return JSON.stringify(data, null, 2)
  }

  const value = {
    status,
    data,
    hasVault: status !== 'empty',
    settings: data?.settings ?? null,
    unlock,
    lock,
    createVault,
    save,
    changePasscode,
    resetApp,
    exportPlain,
  }

  return <VaultContext.Provider value={value}>{children}</VaultContext.Provider>
}

export function useVault() {
  const ctx = useContext(VaultContext)
  if (!ctx) throw new Error('useVault must be used within VaultProvider')
  return ctx
}
