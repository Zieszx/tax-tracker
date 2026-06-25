import { render, screen, fireEvent, act } from '@testing-library/react'
import { beforeEach, afterEach, test, expect, vi } from 'vitest'
import ThemeToggle from './ThemeToggle.jsx'

// Helper to mock matchMedia
function mockMatchMedia(prefersDark) {
  const listeners = []
  const mql = {
    matches: prefersDark,
    addEventListener: (event, fn) => { listeners.push(fn) },
    removeEventListener: (event, fn) => {
      const i = listeners.indexOf(fn)
      if (i !== -1) listeners.splice(i, 1)
    },
    // expose so we can fire change events
    _listeners: listeners,
  }
  window.matchMedia = vi.fn(() => mql)
  return mql
}

beforeEach(() => {
  localStorage.clear()
  delete document.documentElement.dataset.theme
})

afterEach(() => {
  vi.restoreAllMocks()
})

test('system + dark matchMedia → data-theme="dark"', () => {
  mockMatchMedia(true) // device prefers dark
  // localStorage empty → default is 'system'
  render(<ThemeToggle />)
  expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
})

test('system + light matchMedia → data-theme="light"', () => {
  mockMatchMedia(false) // device prefers light
  render(<ThemeToggle />)
  expect(document.documentElement.getAttribute('data-theme')).toBe('light')
})

test('cycling system → light → dark → system changes attribute correctly', () => {
  mockMatchMedia(true) // device is dark

  render(<ThemeToggle />)
  // initial: system → resolved dark
  expect(document.documentElement.getAttribute('data-theme')).toBe('dark')

  const btn = screen.getByRole('button')

  // click 1: system → light
  fireEvent.click(btn)
  expect(document.documentElement.getAttribute('data-theme')).toBe('light')

  // click 2: light → dark
  fireEvent.click(btn)
  expect(document.documentElement.getAttribute('data-theme')).toBe('dark')

  // click 3: dark → system (device is dark → resolves dark)
  fireEvent.click(btn)
  expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
})

test('clicking system → light stores "light" in localStorage', () => {
  mockMatchMedia(false)
  render(<ThemeToggle />)
  const btn = screen.getByRole('button')
  fireEvent.click(btn) // → light
  expect(localStorage.getItem('theme')).toBe('"light"')
})

test('button has an accessible aria-label', () => {
  mockMatchMedia(false)
  render(<ThemeToggle />)
  const btn = screen.getByRole('button')
  expect(btn).toHaveAttribute('aria-label')
  expect(btn.getAttribute('aria-label').length).toBeGreaterThan(0)
})
