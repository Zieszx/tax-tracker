/**
 * csvImport.js — Task 4.2 (pure, no React)
 *
 * Parses a bank CSV statement and maps credit rows to part-time income entries.
 *
 * Exports:
 *   parseBankCsv(text)               → { rows: [{date, description, credit, debit}] }
 *   creditsToPartTime(rows, year)    → [{ month: 'YYYY-MM', entry: {date, amount, note} }]
 */

// ── CSV tokenizer (handles quoted fields) ──────────────────────────────────────

/**
 * Parse a single CSV line into an array of string tokens.
 * Handles double-quoted fields (including fields with embedded commas/newlines).
 */
function parseCsvLine(line) {
  const tokens = []
  let i = 0
  const len = line.length

  while (i <= len) {
    if (i === len) {
      // End of line — push empty token only if we're mid-field tracking
      break
    }

    if (line[i] === '"') {
      // Quoted field
      i++ // skip opening quote
      let field = ''
      while (i < len) {
        if (line[i] === '"') {
          if (line[i + 1] === '"') {
            // Escaped quote
            field += '"'
            i += 2
          } else {
            i++ // skip closing quote
            break
          }
        } else {
          field += line[i]
          i++
        }
      }
      tokens.push(field.trim())
      // Skip comma after field
      if (line[i] === ',') i++
    } else {
      // Unquoted field — read until comma or end
      let start = i
      while (i < len && line[i] !== ',') i++
      tokens.push(line.slice(start, i).trim())
      if (line[i] === ',') i++
    }
  }

  return tokens
}

// ── Header detection ───────────────────────────────────────────────────────────

/**
 * Find column indices for date, description, credit, debit in a header row.
 * Case-insensitive, tolerates common header name variants.
 */
function detectColumns(headerTokens) {
  const cols = {}

  headerTokens.forEach((h, idx) => {
    const lower = h.toLowerCase().trim()
    if (/^date/.test(lower) && cols.date === undefined) cols.date = idx
    else if (/desc|narr|particular|remark/.test(lower) && cols.desc === undefined) cols.desc = idx
    else if (/^credit$|^cr$|^credit amount/.test(lower) && cols.credit === undefined) cols.credit = idx
    else if (/^debit$|^dr$|^debit amount/.test(lower) && cols.debit === undefined) cols.debit = idx
    // Fallback: if no explicit credit/debit, look for "amount"
    else if (/^amount$/.test(lower) && cols.amount === undefined) cols.amount = idx
  })

  return cols
}

// ── Date parsing ───────────────────────────────────────────────────────────────

/**
 * Try to parse a date string in common formats (DD/MM/YYYY, YYYY-MM-DD, DD-MM-YYYY).
 * Returns { year, month, day, iso } or null if unparseable.
 */
function parseDate(raw) {
  if (!raw || typeof raw !== 'string') return null
  raw = raw.trim()

  let m

  // DD/MM/YYYY or DD-MM-YYYY
  m = raw.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/)
  if (m) {
    const [, dd, mm, yyyy] = m
    const y = parseInt(yyyy, 10)
    const mo = parseInt(mm, 10)
    const d = parseInt(dd, 10)
    if (mo < 1 || mo > 12 || d < 1 || d > 31) return null
    return {
      year: y,
      month: mo,
      day: d,
      iso: `${yyyy}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
    }
  }

  // YYYY-MM-DD or YYYY/MM/DD
  m = raw.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/)
  if (m) {
    const [, yyyy, mm, dd] = m
    const y = parseInt(yyyy, 10)
    const mo = parseInt(mm, 10)
    const d = parseInt(dd, 10)
    if (mo < 1 || mo > 12 || d < 1 || d > 31) return null
    return {
      year: y,
      month: mo,
      day: d,
      iso: `${yyyy}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
    }
  }

  return null
}

// ── Amount parsing ─────────────────────────────────────────────────────────────

/**
 * Parse an amount string (e.g. "1,500.00" or "1500.00") to a number.
 * Returns 0 if the string is empty or non-numeric.
 */
function parseAmount(raw) {
  if (!raw || typeof raw !== 'string') return 0
  const clean = raw.replace(/,/g, '').trim()
  if (!clean) return 0
  const n = parseFloat(clean)
  return isNaN(n) ? 0 : n
}

// ── parseBankCsv ───────────────────────────────────────────────────────────────

/**
 * Parse a bank CSV statement text.
 *
 * Returns { rows } where each row has:
 *   { date: string (ISO YYYY-MM-DD), description: string, credit: number, debit: number }
 *
 * Only credit rows (credit > 0) are returned. Debit-only rows are excluded.
 * Malformed lines (unparseable date, non-numeric amounts) are silently skipped.
 *
 * Tolerates:
 *   - Quoted fields
 *   - Case-insensitive header column names
 *   - Common Bank Islam format: Date, Description, Debit, Credit, Balance
 *   - Windows (\r\n) and Unix (\n) line endings
 */
export function parseBankCsv(text) {
  if (!text || typeof text !== 'string') return { rows: [] }

  const lines = text.split(/\r?\n/)
  const rows = []

  let headerLine = null
  let cols = null

  for (const raw of lines) {
    const line = raw.trim()
    if (!line) continue

    const tokens = parseCsvLine(line)
    if (tokens.length === 0) continue

    // Detect header row (first row containing date-like column name)
    if (!cols) {
      const candidate = detectColumns(tokens)
      if (candidate.date !== undefined) {
        cols = candidate
        headerLine = tokens
        continue
      }
      // Skip lines before we find the header
      continue
    }

    // Data row — need at least as many tokens as header
    if (tokens.length < 2) continue

    // Date
    const dateRaw = tokens[cols.date] ?? ''
    const parsedDate = parseDate(dateRaw)
    if (!parsedDate) continue // skip malformed date

    // Description
    const description = cols.desc !== undefined ? (tokens[cols.desc] ?? '') : ''

    // Credit / debit
    let credit = 0
    let debit = 0

    if (cols.credit !== undefined) {
      credit = parseAmount(tokens[cols.credit])
    } else if (cols.amount !== undefined) {
      // If only "amount" column: treat positive as credit
      const amt = parseAmount(tokens[cols.amount])
      if (amt > 0) credit = amt
      else debit = Math.abs(amt)
    }

    if (cols.debit !== undefined) {
      debit = parseAmount(tokens[cols.debit])
    }

    // Only include credit rows with a positive credit amount
    if (credit <= 0) continue

    rows.push({
      date: parsedDate.iso,
      description: description.trim(),
      credit,
      debit,
    })
  }

  return { rows }
}

// ── creditsToPartTime ──────────────────────────────────────────────────────────

/**
 * Map an array of credit rows (from parseBankCsv) to part-time income entries,
 * grouped by month.
 *
 * Only rows whose date falls in `year` are included.
 *
 * Returns an array of:
 *   { month: 'YYYY-MM', entry: { date: 'YYYY-MM-DD', amount: number, note: string } }
 */
export function creditsToPartTime(rows, year) {
  if (!Array.isArray(rows)) return []

  const result = []

  for (const row of rows) {
    const parsedDate = parseDate(row.date)
    if (!parsedDate) continue
    if (parsedDate.year !== year) continue

    const month = `${parsedDate.year}-${String(parsedDate.month).padStart(2, '0')}`

    result.push({
      month,
      entry: {
        date: row.date,
        amount: row.credit,
        note: row.description || 'CSV import',
      },
    })
  }

  return result
}
