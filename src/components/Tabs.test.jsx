/**
 * Tabs.test.jsx — Task B1
 *
 * TDD: renders 3 tabs; clicking a tab calls onChange; ArrowRight moves selection;
 * active tab has aria-selected="true".
 */

import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import Tabs from './Tabs.jsx'

const TABS = [
  { id: 'months', label: 'Months' },
  { id: 'sources', label: 'Sources' },
  { id: 'import', label: 'Import' },
]

test('renders 3 tab buttons', () => {
  render(<Tabs tabs={TABS} active="months" onChange={() => {}} />)
  const tabEls = screen.getAllByRole('tab')
  expect(tabEls.length).toBe(3)
  expect(tabEls[0]).toHaveTextContent('Months')
  expect(tabEls[1]).toHaveTextContent('Sources')
  expect(tabEls[2]).toHaveTextContent('Import')
})

test('active tab has aria-selected="true", others "false"', () => {
  render(<Tabs tabs={TABS} active="sources" onChange={() => {}} />)
  const [months, sources, importTab] = screen.getAllByRole('tab')
  expect(months).toHaveAttribute('aria-selected', 'false')
  expect(sources).toHaveAttribute('aria-selected', 'true')
  expect(importTab).toHaveAttribute('aria-selected', 'false')
})

test('clicking a tab calls onChange with its id', () => {
  const onChange = vi.fn()
  render(<Tabs tabs={TABS} active="months" onChange={onChange} />)
  fireEvent.click(screen.getByRole('tab', { name: 'Sources' }))
  expect(onChange).toHaveBeenCalledWith('sources')
})

test('ArrowRight key moves focus/selection to the next tab', () => {
  const onChange = vi.fn()
  render(<Tabs tabs={TABS} active="months" onChange={onChange} />)
  const monthsTab = screen.getByRole('tab', { name: 'Months' })
  fireEvent.keyDown(monthsTab, { key: 'ArrowRight' })
  expect(onChange).toHaveBeenCalledWith('sources')
})

test('ArrowRight wraps from last to first tab', () => {
  const onChange = vi.fn()
  render(<Tabs tabs={TABS} active="import" onChange={onChange} />)
  const importTab = screen.getByRole('tab', { name: 'Import' })
  fireEvent.keyDown(importTab, { key: 'ArrowRight' })
  expect(onChange).toHaveBeenCalledWith('months')
})

test('ArrowLeft moves to the previous tab', () => {
  const onChange = vi.fn()
  render(<Tabs tabs={TABS} active="sources" onChange={onChange} />)
  const sourcesTab = screen.getByRole('tab', { name: 'Sources' })
  fireEvent.keyDown(sourcesTab, { key: 'ArrowLeft' })
  expect(onChange).toHaveBeenCalledWith('months')
})
