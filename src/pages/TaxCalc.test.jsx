import { render, screen } from '@testing-library/react'
import { ProfileProvider } from '../hooks/useProfile.js'
import { computeTax } from '../engine/tax.js'
import { defaultProfile } from '../data/defaultProfile.js'
import { formatRM } from '../engine/format.js'
import TaxCalc from './TaxCalc.jsx'

beforeEach(() => localStorage.clear())

test('renders breakdown and three scenario columns', () => {
  render(<ProfileProvider><TaxCalc /></ProfileProvider>)
  expect(screen.getByText(/Tax Breakdown/i)).toBeInTheDocument()
  expect(screen.getByText(/Main only/i)).toBeInTheDocument()
  expect(screen.getByText(/Main \+ part-time/i)).toBeInTheDocument()
  expect(screen.getByText(/Reliefs maxed/i)).toBeInTheDocument()
})

test('renders the computed gross tax figure for the default profile', () => {
  render(<ProfileProvider><TaxCalc /></ProfileProvider>)
  const expected = formatRM(computeTax(defaultProfile).grossTax)
  expect(screen.getAllByText(expected).length).toBeGreaterThan(0)
})
