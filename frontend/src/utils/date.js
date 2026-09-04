const monthLabelFormatter = new Intl.DateTimeFormat('pt-BR', {
  month: 'long',
  year: 'numeric',
})

const shortMonthLabelFormatter = new Intl.DateTimeFormat('pt-BR', {
  month: 'short',
})

export function currentYearMonth() {
  const now = new Date()
  return { year: now.getFullYear(), month: now.getMonth() }
}

export function sameYearMonth(dateString, { year, month }) {
  const date = new Date(dateString)
  return date.getFullYear() === year && date.getMonth() === month
}

export function yearMonthToIndex({ year, month }) {
  return year * 12 + month
}

export function dateYearMonth(dateString) {
  const date = new Date(dateString)
  return { year: date.getFullYear(), month: date.getMonth() }
}

export function formatMonthLabel({ year, month }) {
  const label = monthLabelFormatter.format(new Date(year, month, 1))
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export function shiftMonth({ year, month }, delta) {
  const date = new Date(year, month + delta, 1)
  return { year: date.getFullYear(), month: date.getMonth() }
}

export function todayDateInputValue() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function dateInputValueToISOString(value) {
  return new Date(`${value}T12:00:00`).toISOString()
}

export function isoStringToDateInputValue(isoString) {
  const date = new Date(isoString)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function formatShortMonthLabel({ year, month }, includeYear = false) {
  const label = shortMonthLabelFormatter.format(new Date(year, month, 1)).replace('.', '')
  if (!includeYear) return label
  return `${label}/${String(year).slice(2)}`
}

export function dateStringToYearMonth(dateString) {
  const [year, month] = dateString.split('-').map(Number)
  return { year, month: month - 1 }
}

export function monthsInRange(fromDateString, toDateString) {
  const end = toDateString ? dateStringToYearMonth(toDateString) : currentYearMonth()
  const start = fromDateString ? dateStringToYearMonth(fromDateString) : shiftMonth(end, -5)

  const months = []
  let cursor = start
  while (cursor.year < end.year || (cursor.year === end.year && cursor.month <= end.month)) {
    months.push(cursor)
    cursor = shiftMonth(cursor, 1)
  }
  return months.length ? months : [end]
}

export function parseFlexibleDateInput(text) {
  const trimmed = text.trim()
  if (!trimmed) return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed

  const brMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/)
  if (brMatch) {
    const [, day, month, yearRaw] = brMatch
    const year = yearRaw.length === 2 ? `20${yearRaw}` : yearRaw
    return `${year.padStart(4, '0')}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  }

  return ''
}

export function formatDateInputValue(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return ''
  const [year, month, day] = value.split('-')
  return `${day}/${month}/${year}`
}

export function clampDayOfMonth(value) {
  const digitsOnly = value.replace(/[^\d]/g, '')
  if (digitsOnly === '') return ''

  const num = Number(digitsOnly)
  if (num > 31) return '31'
  if (num < 1) return '1'
  return String(num)
}

export const MONTH_NAMES_PT = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
]

export function monthsUntilGoal(goalMonth, goalYear) {
  const { year, month } = currentYearMonth()
  return (goalYear * 12 + (goalMonth - 1)) - (year * 12 + month)
}

export function lastMonths(count, endMonth = currentYearMonth()) {
  const months = []
  for (let i = count - 1; i >= 0; i -= 1) {
    months.push(shiftMonth(endMonth, -i))
  }
  return months
}
