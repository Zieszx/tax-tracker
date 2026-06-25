import { render, screen, fireEvent } from '@testing-library/react'
import { ProfileProvider } from '../hooks/useProfile.js'
import Reliefs from './Reliefs.jsx'

beforeEach(() => localStorage.clear())

test('lists reliefs and allows editing an amount in isolation', () => {
  render(<ProfileProvider><Reliefs /></ProfileProvider>)
  expect(screen.getByText(/Personal relief/i)).toBeInTheDocument()

  const lifestyleBefore = screen.getByLabelText(/lifestyle .* amount/i).value

  const sspn = screen.getByLabelText(/SSPN net deposit amount/i)
  fireEvent.change(sspn, { target: { value: '8000' } })
  expect(sspn.value).toBe('8000')

  // Edit is isolated: another relief's input is unchanged.
  expect(screen.getByLabelText(/lifestyle .* amount/i).value).toBe(lifestyleBefore)
})

test('auto relief input is disabled', () => {
  render(<ProfileProvider><Reliefs /></ProfileProvider>)
  expect(screen.getByLabelText(/personal relief amount/i)).toBeDisabled()
})

test('shows a what-if hint for a relief with headroom', () => {
  render(<ProfileProvider><Reliefs /></ProfileProvider>)
  // SSPN seeded at 0 with limit 8000 -> headroom -> hint should render.
  // Multiple reliefs have headroom; assert at least one hint renders.
  const hints = screen.getAllByText(/Top up to/i)
  expect(hints.length).toBeGreaterThan(0)
  // The SSPN hint (limit RM 8,000.00) is present specifically.
  const sspnHint = hints.find((el) => el.textContent.includes('8,000.00'))
  expect(sspnHint).toBeInTheDocument()
  expect(sspnHint.textContent).toMatch(/save about/i)
})
