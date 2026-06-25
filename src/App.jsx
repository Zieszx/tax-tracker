import { Routes, Route } from 'react-router-dom'
import { useVault, VaultProvider } from './security/useVault.jsx'
import { useAutoLock } from './security/useAutoLock.js'
import { ProfileProvider } from './hooks/useProfile.js'
import Nav from './components/Nav.jsx'
import ThemeToggle from './components/ThemeToggle.jsx'
import LockButton from './components/LockButton.jsx'
import Footer from './components/Footer.jsx'
import Dashboard from './pages/Dashboard.jsx'
import IncomeLog from './pages/IncomeLog.jsx'
import Reliefs from './pages/Reliefs.jsx'
import TaxCalc from './pages/TaxCalc.jsx'
import BorangGuide from './pages/BorangGuide.jsx'
import Settings from './pages/Settings.jsx'
import Lock from './pages/Lock.jsx'
import Onboarding from './pages/Onboarding.jsx'

// ── Inner shell (consumes vault context) ──────────────────────────────────────

function AppShell() {
  const { status, settings, lock } = useVault()

  // Auto-lock on inactivity
  useAutoLock({
    status,
    autoLockMinutes: settings?.autoLockMinutes ?? 5,
    lock,
  })

  if (status === 'empty') {
    return <Onboarding />
  }

  if (status === 'locked') {
    return <Lock />
  }

  // status === 'unlocked'
  return (
    <ProfileProvider>
      <div className="app">
        <Nav />
        <main className="main">
          <div className="topbar">
            <ThemeToggle />
            <LockButton />
          </div>
          <div className="container">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/income" element={<IncomeLog />} />
              <Route path="/reliefs" element={<Reliefs />} />
              <Route path="/calc" element={<TaxCalc />} />
              <Route path="/guide" element={<BorangGuide />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </div>
          <Footer />
        </main>
      </div>
    </ProfileProvider>
  )
}

// ── Root export (VaultProvider lives here so tests can also wrap with it) ──────

export default function App() {
  return (
    <VaultProvider>
      <AppShell />
    </VaultProvider>
  )
}
