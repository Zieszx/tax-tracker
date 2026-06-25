import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Nav from './Nav.jsx'

test('renders all five navigation links', () => {
  render(<MemoryRouter><Nav /></MemoryRouter>)
  for (const label of ['Dashboard', 'Income', 'Reliefs', 'Tax Calc', 'BE Guide']) {
    expect(screen.getByText(label)).toBeInTheDocument()
  }
})
