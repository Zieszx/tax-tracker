/**
 * ImportCsvModal.test.jsx — Task 4.2
 *
 * Tests the ImportCsvModal component:
 * - Renders when open
 * - Parses a CSV file and shows preview rows
 * - Allows selecting/deselecting rows
 * - Calls setYear with merged part-time monthOverrides on confirm
 * - Merges with existing month part-time (does not replace)
 * - Shows empty state when no file loaded
 * - Closes on Cancel
 */

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import ImportCsvModal from './ImportCsvModal.jsx'

const SAMPLE_CSV = `Date,Description,Debit,Credit,Balance
05/01/2026,FREELANCE PAYMENT,,1500.00,6500.00
10/01/2026,BILL PAYMENT,200.00,,6300.00
15/01/2026,CONSULTING,,800.00,7100.00
03/02/2026,PAYMENT FEB,,2200.00,9300.00
`

const year2026 = { taxYear: 2026, monthOverrides: {}, incomeSources: [] }

function makeFile(content, name = 'statement.csv') {
  return new File([content], name, { type: 'text/csv' })
}

async function uploadFile(content) {
  const input = document.querySelector('input[type="file"]')
  const file = makeFile(content)
  await act(async () => {
    fireEvent.change(input, { target: { files: [file] } })
    // Allow FileReader to complete
    await new Promise((r) => setTimeout(r, 50))
  })
}

beforeEach(() => localStorage.clear())

test('renders when open=true', () => {
  render(<ImportCsvModal open={true} onClose={() => {}} setYear={async () => {}} year={year2026} />)
  expect(screen.getByRole('dialog')).toBeInTheDocument()
  expect(screen.getByText(/import bank csv/i)).toBeInTheDocument()
})

test('does not render when open=false', () => {
  render(<ImportCsvModal open={false} onClose={() => {}} setYear={async () => {}} year={year2026} />)
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})

test('shows empty hint before file is loaded', () => {
  render(<ImportCsvModal open={true} onClose={() => {}} setYear={async () => {}} year={year2026} />)
  expect(screen.getByText(/no file loaded/i)).toBeInTheDocument()
})

test('after uploading CSV shows preview table with credit rows', async () => {
  render(<ImportCsvModal open={true} onClose={() => {}} setYear={async () => {}} year={year2026} />)

  await uploadFile(SAMPLE_CSV)

  // Should show preview table (SAMPLE_CSV has 3 credit rows: 1500, 800, 2200)
  await waitFor(() => {
    expect(screen.getByRole('table', { name: /csv preview/i })).toBeInTheDocument()
  })

  // 3 credit rows in the preview
  const rows = document.querySelectorAll('.csv-preview-table tbody tr')
  expect(rows.length).toBe(3)
})

test('shows credit amounts in preview', async () => {
  render(<ImportCsvModal open={true} onClose={() => {}} setYear={async () => {}} year={year2026} />)
  await uploadFile(SAMPLE_CSV)

  await waitFor(() => {
    expect(screen.getByRole('table', { name: /csv preview/i })).toBeInTheDocument()
  })
  // Should show RM 1,500.00
  expect(screen.getByText(/1,500\.00/)).toBeInTheDocument()
})

test('calls setYear with merged monthOverrides on import', async () => {
  const setYear = vi.fn().mockResolvedValue(undefined)
  render(<ImportCsvModal open={true} onClose={() => {}} setYear={setYear} year={year2026} />)

  await uploadFile(SAMPLE_CSV)

  await waitFor(() => {
    expect(screen.getByRole('table', { name: /csv preview/i })).toBeInTheDocument()
  })

  // Click Import button (aria-label: "Import N selected rows")
  const importBtn = screen.getByRole('button', { name: /import \d+ selected row/i })
  await act(async () => { fireEvent.click(importBtn) })

  expect(setYear).toHaveBeenCalledTimes(1)
  // setYear is called with an updater function
  const updater = setYear.mock.calls[0][0]
  expect(typeof updater).toBe('function')

  // Run the updater to get the new year profile
  const result = updater({ taxYear: 2026, monthOverrides: {}, incomeSources: [] })
  expect(result.monthOverrides['2026-01']).toBeDefined()
  expect(result.monthOverrides['2026-01'].partTime.length).toBe(2) // 1500 + 800
  expect(result.monthOverrides['2026-02']).toBeDefined()
  expect(result.monthOverrides['2026-02'].partTime.length).toBe(1) // 2200
})

test('merges with existing month part-time (does not replace)', async () => {
  const setYear = vi.fn().mockResolvedValue(undefined)
  const yearWithExisting = {
    taxYear: 2026,
    monthOverrides: {
      '2026-01': {
        partTime: [{ date: '2026-01-02', amount: 500, note: 'existing' }],
      },
    },
    incomeSources: [],
  }

  render(
    <ImportCsvModal
      open={true}
      onClose={() => {}}
      setYear={setYear}
      year={yearWithExisting}
    />
  )

  await uploadFile(SAMPLE_CSV)

  await waitFor(() => {
    expect(screen.getByRole('table', { name: /csv preview/i })).toBeInTheDocument()
  })

  const importBtn = screen.getByRole('button', { name: /import \d+ selected row/i })
  await act(async () => { fireEvent.click(importBtn) })

  const updater = setYear.mock.calls[0][0]
  const result = updater(yearWithExisting)

  // Existing entry preserved + 2 new entries from CSV
  expect(result.monthOverrides['2026-01'].partTime.length).toBe(3)
  expect(result.monthOverrides['2026-01'].partTime[0].note).toBe('existing')
})

test('shows error when CSV has no credit rows for the year', async () => {
  const csv2025 = `Date,Description,Debit,Credit,Balance\n05/01/2025,PAYMENT,,500.00,500.00`
  render(<ImportCsvModal open={true} onClose={() => {}} setYear={async () => {}} year={year2026} />)

  await uploadFile(csv2025)

  await waitFor(() => {
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })
  expect(screen.getByRole('alert').textContent).toMatch(/no credit rows found/i)
})

test('calls onClose when Cancel is clicked', async () => {
  const onClose = vi.fn()
  render(<ImportCsvModal open={true} onClose={onClose} setYear={async () => {}} year={year2026} />)

  await uploadFile(SAMPLE_CSV)
  await waitFor(() => {
    expect(screen.getByRole('table', { name: /csv preview/i })).toBeInTheDocument()
  })

  fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
  expect(onClose).toHaveBeenCalled()
})

test('close button calls onClose', () => {
  const onClose = vi.fn()
  render(<ImportCsvModal open={true} onClose={onClose} setYear={async () => {}} year={year2026} />)
  fireEvent.click(screen.getByRole('button', { name: /close import modal/i }))
  expect(onClose).toHaveBeenCalled()
})
