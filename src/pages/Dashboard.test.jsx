import { render, screen } from '@testing-library/react'
import { ProfileProvider } from '../hooks/useProfile.js'
import Dashboard from './Dashboard.jsx'

function wrap(ui) { return <ProfileProvider>{ui}</ProfileProvider> }

beforeEach(() => localStorage.clear())

test('shows hero balance and key stat labels', () => {
  render(wrap(<Dashboard />))
  expect(screen.getByText(/Total Gross/i)).toBeInTheDocument()
  expect(screen.getByText(/Effective Rate/i)).toBeInTheDocument()
  // Hero card states either Balance Due or Refund
  expect(screen.getByText(/Balance Due|Refund/i)).toBeInTheDocument()
})
