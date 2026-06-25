import { render, screen } from '@testing-library/react'
import { ProfileProvider } from '../hooks/useProfile.js'
import TaxCalc from './TaxCalc.jsx'

beforeEach(() => localStorage.clear())

test('renders breakdown and three scenario columns', () => {
  render(<ProfileProvider><TaxCalc /></ProfileProvider>)
  expect(screen.getByText(/Tax Breakdown/i)).toBeInTheDocument()
  expect(screen.getByText(/Main only/i)).toBeInTheDocument()
  expect(screen.getByText(/Main \+ part-time/i)).toBeInTheDocument()
  expect(screen.getByText(/Reliefs maxed/i)).toBeInTheDocument()
})
