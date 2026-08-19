// Lets amount fields double as a tiny calculator: typing "=10+5.5" and leaving the field
// replaces the text with the computed result, like a spreadsheet cell.
const SAFE_EXPRESSION = /^[\d+\-*/().\s]+$/

export function isAmountFormula(text) {
  return typeof text === 'string' && text.trim().startsWith('=')
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

// Resolves a raw amount field value to its final text: evaluates "=..." formulas, rounded to
// cents, and leaves plain numeric input untouched.
export function resolveAmountInput(text) {
  if (!isAmountFormula(text)) return text

  const result = evaluateAmountFormula(text)
  if (result === null) return text

  return String(Math.round(result * 100) / 100)
}

// True when a resolved amount value can't be submitted as-is: empty, still an unresolved
// formula, non-numeric free text, or out of range. Run text through resolveAmountInput first.
export function isAmountInvalid(text, { allowZero = true } = {}) {
  if (!text) return true
  if (isAmountFormula(text)) return true

  const value = Number(text)
  if (!Number.isFinite(value)) return true

  return allowZero ? value < 0 : value <= 0
}
