import { NavLink } from 'react-router-dom'

const links = [
  { to: '/', label: 'Dashboard', icon: '📊', end: true },
  { to: '/income', label: 'Income', icon: '💰' },
  { to: '/reliefs', label: 'Reliefs', icon: '🎯' },
  { to: '/calc', label: 'Tax Calc', icon: '🧮' },
  { to: '/guide', label: 'BE Guide', icon: '📋' },
  { to: '/settings', label: 'Settings', icon: '⚙️' },
]

export default function Nav() {
  return (
    <nav className="nav">
      <div className="nav-brand">Tax<span>26</span></div>
      <div className="nav-links">
        {links.map((l) => (
          <NavLink key={l.to} to={l.to} end={l.end}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <span className="nav-icon" aria-hidden="true">{l.icon}</span>
            <span className="nav-label">{l.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
