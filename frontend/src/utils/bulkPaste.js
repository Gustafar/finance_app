import { TRANSACTION_TYPES } from './transactionTypes'

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