import { render, screen } from '@testing-library/react'
import App from '../App.jsx'

test('renders app heading', () => {
  render(<App />)
  expect(screen.getByText(/Tax Tracker 2026/i)).toBeInTheDocument()
})
