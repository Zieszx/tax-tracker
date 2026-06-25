import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from '../App.jsx'

test('renders app shell with nav brand and dashboard link', () => {
  render(<MemoryRouter><App /></MemoryRouter>)
  expect(screen.getByText('Dashboard')).toBeInTheDocument()
  expect(screen.getByText('Income')).toBeInTheDocument()
})
