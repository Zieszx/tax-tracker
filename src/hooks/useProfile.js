/**
 * useProfile.js — Task 2.5: active-year vault adapter.
 *
 * Derives the engine-shaped `profile` from the active YearProfile in the vault,
 * running it through materializeMonths so computeTax gets the right shape.
 *
 * Public API (backward-compatible):
 *   profile        — engine-shaped { income:{months}, reliefs, pcbPaid, settings }
 *   result         — computeTax(profile), memoised
 *   year           — the active YearProfile (raw v2 shape)
 *   setYear(fn)    — vault.save updater over years[activeYear]
 *   setProfile(p)  — legacy bridge: accepts an engine-shaped profile and writes
 *                    months back as monthOverrides + reliefs back directly
 *   resetToDefault()
 *   clearToBlank()
 *   exportJson()   — serialises the full AppData
 *   importJson(t)  — validates + replaces active year (or full AppData)
 */

import { createContext, useContext, useMemo } from 'react'
import { useVault } from '../security/useVault.jsx'
import { materializeMonths } from '../state/materialize.js'
import { migrateV1, blankYearProfile } from '../state/appData.js'
import { defaultProfile } from '../data/defaultProfile.js'
import { computeTax } from '../engine/tax.js'

// Sentinel distinguishes "outside provider entirely" from "provider present but vault locked"
const NO_PROVIDER = Symbol('no-provider')
const ProfileContext = createContext(NO_PROVIDER)

// ── helpers ──────────────────────────────────────────────────────────────────

/** Build an engine-shaped profile from a YearProfile + active year number. */
function buildProfile(yearProfile, activeYear) {
  return {
    income: {
      months: materializeMonths(
        yearProfile.incomeSources,
        yearProfile.monthOverrides,
        yearProfile.taxYear ?? activeYear
      ),
    },
    reliefs: yearProfile.reliefs ?? [],
    pcbPaid: yearProfile.pcbPaid ?? [],
    settings: {
      taxYear: yearProfile.taxYear ?? activeYear,
      residentStatus: yearProfile.residentStatus ?? 'resident',
      maritalStatus: yearProfile.maritalStatus ?? 'single',
      taxBrackets: yearProfile.taxBrackets,
    },
  }
}

// ── Provider ─────────────────────────────────────────────────────────────────

export function ProfileProvider({ children }) {
  const vault = useVault()
  const { data, save, status } = vault

  const isUnlocked = status === 'unlocked' && !!data

  // Derive state — always compute (hooks must not be conditional)
  const activeYear = isUnlocked ? data.activeYear : null
  const yearProfile = isUnlocked
    ? (data.years?.[activeYear] ?? blankYearProfile(activeYear))
    : null

  const profile = useMemo(
    () => (yearProfile ? buildProfile(yearProfile, activeYear) : null),
    [yearProfile, activeYear]
  )

  const result = useMemo(
    () => (profile ? computeTax(profile) : null),
    [profile]
  )

  // ── setYear: write an updater over years[activeYear] ─────────────────────
  async function setYear(updater) {
    await save((appData) => ({
      ...appData,
      years: {
        ...appData.years,
        [activeYear]: updater(appData.years?.[activeYear] ?? blankYearProfile(activeYear)),
      },
    }))
  }

  // ── setProfile (legacy bridge) ────────────────────────────────────────────
  // Accepts an engine-shaped profile and converts it back to vault writes.
  // months → monthOverrides (keyed by month string); reliefs → stored directly.
  async function setProfile(nextEngineProfile) {
    await save((appData) => {
      const yr = appData.years?.[activeYear] ?? blankYearProfile(activeYear)

      // Build monthOverrides from the new months array
      const monthOverrides = {}
      const months = nextEngineProfile?.income?.months ?? []
      for (const m of months) {
        monthOverrides[m.month] = {
          mainSalary: m.mainSalary,
          partTime: m.partTime ? m.partTime.map((p) => ({ ...p })) : [],
        }
      }

      return {
        ...appData,
        years: {
          ...appData.years,
          [activeYear]: {
            ...yr,
            reliefs: nextEngineProfile?.reliefs ?? yr.reliefs,
            pcbPaid: nextEngineProfile?.pcbPaid ?? yr.pcbPaid,
            monthOverrides,
          },
        },
      }
    })
  }

  // ── resetToDefault ────────────────────────────────────────────────────────
  async function resetToDefault() {
    const migratedYear = migrateV1(defaultProfile)
    await save((appData) => ({
      ...appData,
      years: {
        ...appData.years,
        [activeYear]: migratedYear,
      },
    }))
  }

  // ── clearToBlank ──────────────────────────────────────────────────────────
  async function clearToBlank() {
    await save((appData) => ({
      ...appData,
      years: {
        ...appData.years,
        [activeYear]: blankYearProfile(activeYear),
      },
    }))
  }

  // ── exportJson ────────────────────────────────────────────────────────────
  function exportJson() {
    return JSON.stringify(data, null, 2)
  }

  // ── importJson ────────────────────────────────────────────────────────────
  // Accepts either:
  //   (a) an engine-shaped profile { income:{months}, reliefs } → replaces active year
  //   (b) a full AppData { schemaVersion, years, ... } → replaces full AppData
  function importJson(text) {
    let parsed
    try {
      parsed = JSON.parse(text)
    } catch {
      throw new Error('Invalid profile file')
    }

    // Full AppData import
    if (parsed?.schemaVersion === 2 && parsed?.years) {
      save(() => parsed)
      return
    }

    // Legacy engine-shaped profile import
    if (!Array.isArray(parsed?.income?.months) || !Array.isArray(parsed?.reliefs)) {
      throw new Error('Invalid profile file')
    }

    // Build monthOverrides from months. Clear incomeSources so the materialized
    // result is 100% driven by overrides (matches v1 engine-shaped profile exactly).
    const monthOverrides = {}
    for (const m of parsed.income.months) {
      monthOverrides[m.month] = {
        mainSalary: m.mainSalary,
        partTime: m.partTime ? m.partTime.map((p) => ({ ...p })) : [],
      }
    }

    save((appData) => {
      const yr = appData.years?.[activeYear] ?? blankYearProfile(activeYear)
      return {
        ...appData,
        years: {
          ...appData.years,
          [activeYear]: {
            ...yr,
            // Clear incomeSources: the import is the sole source of truth for months
            incomeSources: [],
            reliefs: parsed.reliefs,
            pcbPaid: parsed.pcbPaid ?? yr.pcbPaid,
            monthOverrides,
          },
        },
      }
    })
  }

  // ── addYear ───────────────────────────────────────────────────────────────
  // mode: 'blank' | 'clone'
  async function addYear(newYear, mode = 'blank') {
    await save((appData) => {
      const sourceYear =
        mode === 'clone'
          ? (appData.years?.[appData.activeYear] ?? blankYearProfile(newYear))
          : null
      const newProfile =
        mode === 'clone' && sourceYear
          ? { ...sourceYear, taxYear: newYear }
          : blankYearProfile(newYear)
      return {
        ...appData,
        activeYear: newYear,
        years: {
          ...appData.years,
          [newYear]: newProfile,
        },
      }
    })
  }

  // ── setActiveYear ─────────────────────────────────────────────────────────
  async function setActiveYear(newYear) {
    await save((appData) => ({
      ...appData,
      activeYear: newYear,
    }))
  }

  // ── context value ─────────────────────────────────────────────────────────
  // Provide null when vault is locked (consumers check before use)
  const allYears = isUnlocked ? Object.keys(data.years ?? {}).map(Number) : []

  const value = isUnlocked
    ? {
        profile,
        result,
        year: yearProfile,
        activeYear,
        allYears,
        setYear,
        setProfile,
        setActiveYear,
        addYear,
        resetToDefault,
        clearToBlank,
        exportJson,
        importJson,
      }
    : null

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
}

export function useProfile() {
  const ctx = useContext(ProfileContext)
  if (ctx === NO_PROVIDER) throw new Error('useProfile must be used within ProfileProvider')
  return ctx
}
