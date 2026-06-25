import { render, screen, fireEvent } from '@testing-library/react'
import { ProfileProvider } from '../hooks/useProfile.js'
import Reliefs from './Reliefs.jsx'

beforeEach(() => localStorage.clear())

test('lists reliefs and allows editing an amount', () => {
  render(<ProfileProvider><Reliefs /></ProfileProvider>)
  expect(screen.getByText(/Personal relief/i)).toBeInTheDocument()
  const sspn = screen.getByLabelText(/SSPN net deposit amount/i)
  fireEvent.change(sspn, { target: { value: '8000' } })
  expect(sspn.value).toBe('8000')
})
