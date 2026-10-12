import { TRANSACTION_TYPES } from './transactionTypes'
import { parseFlexibleDateInput } from './date'
import { formatAmountForDisplay, isAmountFormula } from './amountFormula'

// Fixed left-to-right order pasted spreadsheet columns are mapped to in the expense grids (bulk
// entry and grid edit), starting from whichever cell was focused when the paste happened.
export const EXPENSE_PASTE_COLUMNS = [
  'date',
  'amount',
  'paymentMethodId',
  'description',
  'subcategoryId',
  'type',
  'personId',
  'bucketId',
  'bankId',
  'comment',
]

// Turns one pasted cell into the row patch for its EXPENSE_PASTE_COLUMNS column; names are matched
// against the lookups lists (subcategories, people, paymentMethods, buckets, banks).
export function parseExpenseCell(columnKey, text, lookups) {
  switch (columnKey) {
    case 'date':
      return { date: parseFlexibleDateInput(text) }
    case 'description':
      return { description: text.trim() }
    case 'amount':
      return { amount: formatAmountForDisplay(parsePastedAmount(text)), amountFormula: null }
    case 'type':
      return { type: resolveType(text) || 'expense' }
    case 'subcategoryId':
      return { subcategoryId: resolveIdByName(lookups.subcategories, text) }
    case 'personId':
      return { personId: resolveIdByName(lookups.people, text) }
    case 'paymentMethodId':
      return { paymentMethodId: resolveIdByName(lookups.paymentMethods, text) }
    case 'bucketId':
      return { bucketId: resolveIdByName(lookups.buckets, text) }
    case 'bankId':
      return { bankId: resolveIdByName(lookups.banks, text) }
    case 'comment':
      return { comment: text.trim() }
    default:
      return {}
  }
}

// True when a paste into an expense grid cell should behave like a normal paste (insert at the
// cursor, keep surrounding text) instead of being spread across cells as spreadsheet data: plain
// single-cell text into the description, or a single "=10+5" formula into the amount.
export function isPlainExpenseCellPaste(columnKey, text) {
  if (/[\t\n]/.test(text)) return false
  return columnKey === 'description' || (columnKey === 'amount' && isAmountFormula(text))
}

// Parses clipboard text copied from a spreadsheet (tab-separated cells, newline-separated rows).
// Excel/Sheets wrap a cell in double quotes when its content itself has a tab, newline or quote,
// doubling any inner quotes ("" -> ") — those wrapped newlines/tabs must NOT be treated as row/cell
// separators, or every row after the multi-line cell shifts and silently drops values.
export function parseTsv(text) {
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const rows = []
  let row = []
  let cell = ''
  let inQuotes = false

  for (let i = 0; i < normalized.length; i += 1) {
    const char = normalized[i]

    if (inQuotes) {
      if (char === '"') {
        if (normalized[i + 1] === '"') {
          cell += '"'
          i += 1
        } else {
          inQuotes = false
        }
      } else {
        cell += char
      }
      continue
    }

    if (char === '"' && cell === '') {
      inQuotes = true
    } else if (char === '\t') {
      row.push(cell)
      cell = ''
    } else if (char === '\n') {
      row.push(cell)
      rows.push(row)
      row = []
      cell = ''
    } else {
      cell += char
    }
  }

  row.push(cell)
  rows.push(row)

  if (rows.length > 1) {
    const last = rows[rows.length - 1]
    if (last.length === 1 && last[0] === '') rows.pop()
  }

  return rows
}

export function parsePastedAmount(text) {
  const trimmed = text.trim().replace(/[^\d,.-]/g, '')
  if (!trimmed) return ''
  if (trimmed.includes(',') && trimmed.includes('.')) {
    return trimmed.replace(/\./g, '').replace(',', '.')
  }
  if (trimmed.includes(',')) {
    return trimmed.replace(',', '.')
  }
  return trimmed
}

export function resolveIdByName(list, text) {
  const needle = text.trim().toLowerCase()
  if (!needle) return ''
  const match = list.find((item) => item.name.toLowerCase() === needle)
  return match ? String(match.id) : ''
}

export function resolveType(text) {
  const needle = text.trim().toLowerCase()
  const match = TRANSACTION_TYPES.find((t) => t.label.toLowerCase() === needle || t.value.toLowerCase() === needle)
  return match ? match.value : ''
}