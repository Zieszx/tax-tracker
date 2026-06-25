import { render, screen } from '@testing-library/react'
import StatCard from './StatCard.jsx'

test('StatCard shows label and value', () => {
  render(<StatCard label="Gross" value="RM 72,500.00" />)
  expect(screen.getByText('Gross')).toBeInTheDocument()
  expect(screen.getByText('RM 72,500.00')).toBeInTheDocument()
})
