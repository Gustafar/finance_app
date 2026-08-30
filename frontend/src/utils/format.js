const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

const compactCurrencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  notation: 'compact',
  maximumFractionDigits: 1,
})

const HIDDEN_VALUE_MASK = '••••••'

export function formatCurrency(value, hidden) {
  if (hidden) return HIDDEN_VALUE_MASK
  return currencyFormatter.format(value ?? 0)
}

export function formatCompactCurrency(value, hidden) {
  if (hidden) return HIDDEN_VALUE_MASK
  return compactCurrencyFormatter.format(value ?? 0)
}

export function formatDate(dateString) {
  return dateFormatter.format(new Date(dateString))
}
