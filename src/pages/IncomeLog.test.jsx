import { render, screen, fireEvent } from '@testing-library/react'
import { ProfileProvider, useProfile } from '../hooks/useProfile.js'
import IncomeLog from './IncomeLog.jsx'

beforeEach(() => localStorage.clear())

test('editing a main salary updates the running total', () => {
  render(<ProfileProvider><IncomeLog /></ProfileProvider>)
  const firstInput = screen.getAllByLabelText(/main salary/i)[0]
  const before = screen.getByText(/Grand total income/i).textContent
  fireEvent.change(firstInput, { target: { value: '5000' } })
  expect(firstInput.value).toBe('5000')
  // The running total must re-render to reflect the edit, not just the input value.
  const after = screen.getByText(/Grand total income/i).textContent
  expect(after).not.toBe(before)
  expect(after).toMatch(/Grand total income/i)
})
