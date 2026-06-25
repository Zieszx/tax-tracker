import { render, screen, fireEvent } from '@testing-library/react'
import Button from './Button.jsx'
test('renders variant class and fires onClick', () => {
  const fn = vi.fn()
  render(<Button variant="gold" onClick={fn}>Save</Button>)
  const b = screen.getByRole('button', { name: 'Save' })
  expect(b.className).toMatch(/btn-gold/)
  fireEvent.click(b); expect(fn).toHaveBeenCalled()
})
