/**
 * useAutoLock.js — Task 2.4
 *
 * Listens for user inactivity while the vault is 'unlocked'.
 * After `autoLockMinutes` of no pointermove/keydown/scroll events,
 * calls lock().
 *
 * Also locks on visibilitychange (tab hidden beyond the same grace period).
 */

import { useEffect, useRef } from 'react'

/**
 * @param {object} opts
 * @param {'empty'|'locked'|'unlocked'} opts.status   — vault status
 * @param {number}  opts.autoLockMinutes               — from settings (default 5)
 * @param {Function} opts.lock                         — vault.lock()
 */
export function useAutoLock({ status, autoLockMinutes, lock }) {
  const timerRef = useRef(null)

  // Keep the latest `lock` in a ref so the effect below does not depend on its
  // identity. VaultProvider recreates `lock` on every render; without this the
  // effect would tear down and re-arm the inactivity timer on unrelated
  // re-renders, weakening auto-lock.
  const lockRef = useRef(lock)
  useEffect(() => { lockRef.current = lock }, [lock])

  useEffect(() => {
    if (status !== 'unlocked') return

    const delayMs = (autoLockMinutes ?? 5) * 60 * 1000

    function resetTimer() {
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => lockRef.current(), delayMs)
    }

    function handleVisibility() {
      if (document.hidden) {
        // Start timer immediately when tab becomes hidden
        resetTimer()
      } else {
        // Tab visible again — reset the inactivity clock
        resetTimer()
      }
    }

    const events = ['pointermove', 'pointerdown', 'keydown', 'scroll', 'touchstart']
    events.forEach(e => window.addEventListener(e, resetTimer, { passive: true }))
    document.addEventListener('visibilitychange', handleVisibility)

    // Kick off the initial timer
    resetTimer()

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      events.forEach(e => window.removeEventListener(e, resetTimer))
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [status, autoLockMinutes])
}
