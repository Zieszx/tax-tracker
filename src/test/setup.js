import '@testing-library/jest-dom'

// Polyfill ResizeObserver for jsdom (used by Recharts ResponsiveContainer)
if (typeof ResizeObserver === 'undefined') {
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}

// Polyfill window.matchMedia for jsdom (used by ThemeToggle prefers-color-scheme)
if (typeof window.matchMedia === 'undefined') {
  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })
}
