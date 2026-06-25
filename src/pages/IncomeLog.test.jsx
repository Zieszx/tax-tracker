import { render, screen, fireEvent } from '@testing-library/react'
import { ProfileProvider, useProfile } from '../hooks/useProfile.js'
import IncomeLog from './IncomeLog.jsx'

beforeEach(() => localStorage.clear())

test('editing a main salary updates the running total', () => {
  render(<ProfileProvider><IncomeLog /></ProfileProvider>)
  const firstInput = screen.getAllByLabelText(/main salary/i)[0]
  fireEvent.change(firstInput, { target: { value: '5000' } })
  expect(firstInput.value).toBe('5000')
})
