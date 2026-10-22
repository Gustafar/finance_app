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

export function todayParts() {
  const now = new Date()
  return { year: now.getFullYear(), month: now.getMonth(), day: now.getDate() }
}

export function toISODate(year, month, day) {
  return `${String(year).padStart(4, '0')}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export function buildMonthGrid(year, month) {
  const firstWeekday = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrevMonth = new Date(year, month, 0).getDate()

  const cells = []
  for (let i = firstWeekday - 1; i >= 0; i -= 1) {
    cells.push({ day: daysInPrevMonth - i, monthOffset: -1 })
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({ day, monthOffset: 0 })
  }
  let trailing = 1
  while (cells.length % 7 !== 0 || cells.length < 42) {
    cells.push({ day: trailing, monthOffset: 1 })
    trailing += 1
  }
  return cells
}

// A period is a { from, to } pair of 'YYYY-MM-DD' strings, both ends inclusive.

export function monthPeriod({ year, month }) {
  const lastDay = new Date(year, month + 1, 0).getDate()
  return { from: toISODate(year, month, 1), to: toISODate(year, month, lastDay) }
}

export function currentMonthPeriod() {
  return monthPeriod(currentYearMonth())
}

function addDays(dateString, delta) {
  const [year, month, day] = dateString.split('-').map(Number)
  const date = new Date(year, month - 1, day + delta)
  return toISODate(date.getFullYear(), date.getMonth(), date.getDate())
}

export function lastDaysPeriod(count) {
  const to = todayDateInputValue()
  return { from: addDays(to, -(count - 1)), to }
}

export function yearPeriod(year) {
  return { from: `${year}-01-01`, to: `${year}-12-31` }
}

export function isInPeriod(isoString, { from, to }) {
  const date = isoStringToDateInputValue(isoString)
  return date >= from && date <= to
}

// Whole calendar months (e.g. 01/03–31/05) shift month by month; any other span shifts by its own
// length in days, so the arrows always land on an adjacent period of the same size.
function wholeMonthSpan({ from, to }) {
  const start = dateStringToYearMonth(from)
  const end = dateStringToYearMonth(to)
  if (from !== monthPeriod(start).from || to !== monthPeriod(end).to) return null
  return yearMonthToIndex(end) - yearMonthToIndex(start) + 1
}

export function shiftPeriod(period, delta) {
  const monthSpan = wholeMonthSpan(period)
  if (monthSpan) {
    const offset = delta * monthSpan
    return {
      from: monthPeriod(shiftMonth(dateStringToYearMonth(period.from), offset)).from,
      to: monthPeriod(shiftMonth(dateStringToYearMonth(period.to), offset)).to,
    }
  }

  const [fromYear, fromMonth, fromDay] = period.from.split('-').map(Number)
  const [toYear, toMonth, toDay] = period.to.split('-').map(Number)
  const lengthInDays = Math.round((Date.UTC(toYear, toMonth - 1, toDay) - Date.UTC(fromYear, fromMonth - 1, fromDay)) / 86400000) + 1
  return { from: addDays(period.from, delta * lengthInDays), to: addDays(period.to, delta * lengthInDays) }
}

export function formatPeriodLabel(period) {
  if (wholeMonthSpan(period) === 1) return formatMonthLabel(dateStringToYearMonth(period.from))
  if (period.from === period.to) return formatDateInputValue(period.from)

  const fromLabel = formatDateInputValue(period.from)
  const toLabel = formatDateInputValue(period.to)
  if (period.from.slice(0, 4) === period.to.slice(0, 4)) return `${fromLabel.slice(0, 5)} – ${toLabel}`
  return `${fromLabel} – ${toLabel}`
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
