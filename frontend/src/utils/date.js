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

export function formatShortMonthLabel({ year, month }) {
  return shortMonthLabelFormatter.format(new Date(year, month, 1)).replace('.', '')
}

export function lastMonths(count, endMonth = currentYearMonth()) {
  const months = []
  for (let i = count - 1; i >= 0; i -= 1) {
    months.push(shiftMonth(endMonth, -i))
  }
  return months
}
