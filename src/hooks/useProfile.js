import { createContext, useContext, useMemo } from 'react'
import { useLocalStorage } from './useLocalStorage.js'
import { defaultProfile, blankProfile } from '../data/defaultProfile.js'
import { computeTax } from '../engine/tax.js'

const ProfileContext = createContext(null)

export function ProfileProvider({ children }) {
  const [profile, setProfile] = useLocalStorage('tax-profile-2026', defaultProfile)
  const result = useMemo(() => computeTax(profile), [profile])

  const value = {
    profile,
    setProfile,
    result,
    resetToDefault: () => setProfile(defaultProfile),
    clearToBlank: () => setProfile(blankProfile),
    exportJson: () => JSON.stringify(profile, null, 2),
    importJson: (text) => {
      const parsed = JSON.parse(text)
      if (!parsed.income || !parsed.reliefs) throw new Error('Invalid profile file')
      setProfile(parsed)
    },
  }
  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
}

export function useProfile() {
  const ctx = useContext(ProfileContext)
  if (!ctx) throw new Error('useProfile must be used within ProfileProvider')
  return ctx
}
