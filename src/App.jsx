import { Routes, Route } from 'react-router-dom'
import { ProfileProvider } from './hooks/useProfile.js'
import Nav from './components/Nav.jsx'
import ThemeToggle from './components/ThemeToggle.jsx'
import Footer from './components/Footer.jsx'
import Dashboard from './pages/Dashboard.jsx'
import IncomeLog from './pages/IncomeLog.jsx'
import Reliefs from './pages/Reliefs.jsx'
import TaxCalc from './pages/TaxCalc.jsx'
import BorangGuide from './pages/BorangGuide.jsx'

export default function App() {
  return (
    <ProfileProvider>
      <div className="app">
        <Nav />
        <main className="main">
          <div className="topbar"><ThemeToggle /></div>
          <div className="container">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/income" element={<IncomeLog />} />
              <Route path="/reliefs" element={<Reliefs />} />
              <Route path="/calc" element={<TaxCalc />} />
              <Route path="/guide" element={<BorangGuide />} />
            </Routes>
          </div>
          <Footer />
        </main>
      </div>
    </ProfileProvider>
  )
}
