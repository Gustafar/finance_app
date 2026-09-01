// Lets amount fields double as a tiny calculator: typing "=10+5.5" and leaving the field
// replaces the text with the computed result, like a spreadsheet cell.
const SAFE_EXPRESSION = /^[\d+\-*/().\s]+$/

export function isAmountFormula(text) {
  return typeof text === 'string' && text.trim().startsWith('=')
}

// Normalizes pt-BR style decimal input (comma as decimal separator, e.g. "10,50" from an
// iPhone numeric keypad, or "1.234,56" with a thousands separator) to a dot-decimal string
// that Number()/parseFloat() can parse.
export function normalizeAmountSeparators(text) {
  if (typeof text !== 'string') return text

  const trimmed = text.trim()
  if (trimmed.includes(',') && trimmed.includes('.')) {
    return trimmed.replace(/\./g, '').replace(',', '.')
  }
  if (trimmed.includes(',')) {
    return trimmed.replace(',', '.')
  }
  return trimmed
}

// Returns the computed number, or null if the formula is empty/invalid/unsafe.
export function evaluateAmountFormula(text) {
  const expression = text.trim().slice(1).trim().replace(/,/g, '.')
  if (!expression || !SAFE_EXPRESSION.test(expression)) return null

  try {
    const result = Function(`"use strict"; return (${expression});`)()
    return Number.isFinite(result) ? result : null
  } catch {
    return null
  }
}

// Live input mask for amount fields: as the user types digits, formats them as pt-BR currency
// (thousands "." separator, "," decimal, always 2 decimals) by treating the typed digits as
// cents — e.g. "1" -> "0,01", "12345" -> "123,45", "1234567" -> "12.345,67". Formula input
// ("=10+5,50") is left untouched so the calculator flow in resolveAmountInput keeps working.
export function maskAmountInput(text) {
  if (typeof text !== 'string') return text
  if (isAmountFormula(text)) return text

  const digits = text.replace(/\D/g, '')
  if (!digits) return ''

  const cents = parseInt(digits, 10)
  return (cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// Formats a stored numeric amount (e.g. loaded from the API as 1234.5) as masked display text
// ("1.234,50") for initializing an amount field that uses maskAmountInput.
export function formatAmountForDisplay(value) {
  const num = typeof value === 'number' ? value : parseFloat(value)
  if (!Number.isFinite(num)) return ''
  return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// Resolves a raw amount field value to its final text: evaluates "=..." formulas, rounded to
// cents, and leaves plain numeric input untouched.
export function resolveAmountInput(text) {
  if (!isAmountFormula(text)) return normalizeAmountSeparators(text)

  const result = evaluateAmountFormula(text)
  if (result === null) return text

  return String(Math.round(result * 100) / 100)
}

// Converts a field value to masked pt-BR currency text ("1.234,56") for switching a field into
// mask mode. Formula text ("=10+5") is left untouched so the calculator flow still works.
export function toMaskedDisplay(value) {
  if (isAmountFormula(value)) return value
  const num = parseFloat(normalizeAmountSeparators(String(value ?? '')))
  return Number.isFinite(num) ? formatAmountForDisplay(num) : ''
}

// Converts a field value to plain editable text (dot decimal, no thousands separator) for
// switching a field into free-text mode. Formula text is left untouched.
export function toPlainText(value) {
  if (isAmountFormula(value)) return value
  return normalizeAmountSeparators(String(value ?? ''))
}

// True when a resolved amount value can't be submitted as-is: empty, still an unresolved
// formula, non-numeric free text, or out of range. Run text through resolveAmountInput first.
export function isAmountInvalid(text, { allowZero = true } = {}) {
  if (!text) return true
  if (isAmountFormula(text)) return true

  const value = Number(normalizeAmountSeparators(text))
  if (!Number.isFinite(value)) return true

  return allowZero ? value < 0 : value <= 0
}
