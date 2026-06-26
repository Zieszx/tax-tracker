/**
 * Tabs.jsx — Task B1
 *
 * Accessible tab bar: role="tablist", each tab role="tab" with aria-selected.
 * Arrow-key navigation (left/right cycles through tabs).
 * Renders tab buttons only — panels are controlled by the parent.
 *
 * Props:
 *   tabs     — [{ id: string, label: string }]
 *   active   — id of the currently active tab
 *   onChange — (id: string) => void
 */

export default function Tabs({ tabs, active, onChange }) {
  function handleKeyDown(e, index) {
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      const next = (index + 1) % tabs.length
      onChange(tabs[next].id)
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      const prev = (index - 1 + tabs.length) % tabs.length
      onChange(tabs[prev].id)
    }
  }

  return (
    <div role="tablist" className="tabs-bar" aria-label="Income sections">
      {tabs.map((tab, index) => (
        <button
          key={tab.id}
          role="tab"
          id={`tab-${tab.id}`}
          aria-selected={active === tab.id}
          aria-controls={`panel-${tab.id}`}
          tabIndex={active === tab.id ? 0 : -1}
          className={`tabs-btn${active === tab.id ? ' tabs-btn-active' : ''}`}
          onClick={() => onChange(tab.id)}
          onKeyDown={(e) => handleKeyDown(e, index)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
