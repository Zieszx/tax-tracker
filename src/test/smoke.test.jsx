import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from '../App.jsx'

test('renders app shell with nav brand and dashboard link', () => {
  render(<MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><App /></MemoryRouter>)
  expect(screen.getAllByText('Dashboard').length).toBeGreaterThan(0)
  expect(screen.getByText('Income')).toBeInTheDocument()
})
