import '@testing-library/jest-dom'

// Polyfill ResizeObserver for jsdom (used by Recharts ResponsiveContainer)
if (typeof ResizeObserver === 'undefined') {
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}
