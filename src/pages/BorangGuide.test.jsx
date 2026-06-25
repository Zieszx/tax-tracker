import { render, screen } from '@testing-library/react'
import { ProfileProvider } from '../hooks/useProfile.js'
import BorangGuide from './BorangGuide.jsx'

beforeEach(() => localStorage.clear())

test('shows e-filing steps, deadline, and data controls', () => {
  render(<ProfileProvider><BorangGuide /></ProfileProvider>)
  expect(screen.getByText(/Borang BE/i)).toBeInTheDocument()
  expect(screen.getByText(/30 April 2027/i)).toBeInTheDocument()
  expect(screen.getByText(/Export/i)).toBeInTheDocument()
  expect(screen.getByText(/Reset to my 2026 data/i)).toBeInTheDocument()
})
