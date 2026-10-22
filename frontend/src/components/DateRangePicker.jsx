import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  buildMonthGrid,
  currentMonthPeriod,
  currentYearMonth,
  dateStringToYearMonth,
  formatDateInputValue,
  formatMonthLabel,
  formatPeriodLabel,
  lastDaysPeriod,
  monthPeriod,
  shiftMonth,
  toISODate,
  todayParts,
  yearPeriod,
} from '../utils/date'

const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MONTH_LABELS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

const PRESETS = [
  { label: 'Este mês', getPeriod: () => currentMonthPeriod() },
  { label: 'Mês passado', getPeriod: () => monthPeriod(shiftMonth(currentYearMonth(), -1)) },
  { label: 'Últimos 30 dias', getPeriod: () => lastDaysPeriod(30) },
  { label: 'Este ano', getPeriod: () => yearPeriod(todayParts().year) },
]

function orderedPeriod(a, b) {
  return a <= b ? { from: a, to: b } : { from: b, to: a }
}

// value/onChange use a { from, to } pair of 'YYYY-MM-DD' strings. variant="inline" renders the
// trigger as bold text (for toolbars with prev/next arrows); "field" renders it like an input.
function DateRangePicker({ id, value, onChange, disabled, variant = 'field' }) {
  const [isOpen, setIsOpen] = useState(false)
  const [pickerMode, setPickerMode] = useState('days')
  const [popoverStyle, setPopoverStyle] = useState(null)
  const [view, setView] = useState(() => dateStringToYearMonth(value.from))
  // The first clicked day of a new selection; the range is only committed once the other end is picked.
  const [pendingStart, setPendingStart] = useState(null)
  const [hoverDate, setHoverDate] = useState(null)

  const wrapperRef = useRef(null)
  const popoverRef = useRef(null)

  useLayoutEffect(() => {
    if (!isOpen) return
    const wrapperEl = wrapperRef.current
    const popoverEl = popoverRef.current
    if (!wrapperEl || !popoverEl) return

    const margin = 8
    const wrapperRect = wrapperEl.getBoundingClientRect()
    const popoverRect = popoverEl.getBoundingClientRect()

    const spaceBelow = window.innerHeight - wrapperRect.bottom
    const spaceAbove = wrapperRect.top
    const openUpward = spaceBelow < popoverRect.height + margin && spaceAbove > spaceBelow

    let top = openUpward ? wrapperRect.top - popoverRect.height - 4 : wrapperRect.bottom + 4
    top = Math.min(Math.max(top, margin), window.innerHeight - popoverRect.height - margin)

    let left = variant === 'inline' ? wrapperRect.left - (popoverRect.width - wrapperRect.width) / 2 : wrapperRect.left
    left = Math.min(Math.max(left, margin), window.innerWidth - popoverRect.width - margin)

    setPopoverStyle({ position: 'fixed', top, left, visibility: 'visible' })
  }, [isOpen, variant])

  useEffect(() => {
    if (!isOpen) return

    const handlePointerDown = (e) => {
      if (wrapperRef.current?.contains(e.target)) return
      if (popoverRef.current?.contains(e.target)) return
      setIsOpen(false)
    }
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const openPopover = () => {
    if (disabled) return
    setView(dateStringToYearMonth(value.from))
    setPendingStart(null)
    setHoverDate(null)
    setPopoverStyle(null)
    setPickerMode('days')
    setIsOpen(true)
  }

  const toggleOpen = () => {
    if (isOpen) setIsOpen(false)
    else openPopover()
  }

  const commit = (period) => {
    onChange(period)
    setIsOpen(false)
  }

  const pickDay = (date) => {
    if (!pendingStart) {
      setPendingStart(date)
      setHoverDate(date)
      return
    }
    commit(orderedPeriod(pendingStart, date))
  }

  const pickMonth = (month) => {
    commit(monthPeriod({ year: view.year, month }))
  }

  const today = todayParts()
  const cells = buildMonthGrid(view.year, view.month)
  const shown = pendingStart ? orderedPeriod(pendingStart, hoverDate ?? pendingStart) : value
  const presets = PRESETS.map(({ label, getPeriod }) => ({ label, period: getPeriod() }))

  return (
    <div className="date-range-picker" ref={wrapperRef}>
      <button
        id={id}
        type="button"
        className={variant === 'inline' ? 'month-picker-trigger' : 'date-range-picker-trigger'}
        onClick={toggleOpen}
        disabled={disabled}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        {variant !== 'inline' && (
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path
              d="M5 2.2v2.3M11 2.2v2.3M2.8 6.3h10.4M3.8 3.6h8.4a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H3.8a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
        <span>{formatPeriodLabel(value)}</span>
      </button>

      {isOpen &&
        createPortal(
          <div className="date-picker-popover" style={popoverStyle} ref={popoverRef}>
            {pickerMode === 'days' ? (
              <>
                <div className="date-picker-header">
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => setView((v) => shiftMonth(v, -1))}
                    aria-label="Mês anterior"
                  >
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                      <path d="M10 3 5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    className="date-picker-month-label date-picker-month-label--btn"
                    onClick={() => setPickerMode('months')}
                  >
                    {formatMonthLabel(view)}
                  </button>
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => setView((v) => shiftMonth(v, 1))}
                    aria-label="Próximo mês"
                  >
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                      <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>

                <div className="date-picker-weekdays">
                  {WEEKDAY_LABELS.map((label) => (
                    <span key={label}>{label}</span>
                  ))}
                </div>

                <div className="date-picker-grid date-picker-grid--range" onMouseLeave={() => setHoverDate(pendingStart)}>
                  {cells.map(({ day, monthOffset }, index) => {
                    const cellDate = new Date(view.year, view.month + monthOffset, day)
                    const date = toISODate(cellDate.getFullYear(), cellDate.getMonth(), day)
                    const isStart = date === shown.from
                    const isEnd = date === shown.to
                    const isInRange = date > shown.from && date < shown.to
                    const isToday =
                      today.year === cellDate.getFullYear() && today.month === cellDate.getMonth() && today.day === day

                    return (
                      <button
                        type="button"
                        key={index}
                        className={[
                          'date-picker-day',
                          monthOffset !== 0 ? 'date-picker-day--muted' : '',
                          isInRange ? 'date-picker-day--in-range' : '',
                          isStart || isEnd ? 'date-picker-day--selected' : '',
                          isStart ? 'date-picker-day--range-start' : '',
                          isEnd ? 'date-picker-day--range-end' : '',
                          isToday && !isStart && !isEnd ? 'date-picker-day--today' : '',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                        onClick={() => pickDay(date)}
                        onMouseEnter={pendingStart ? () => setHoverDate(date) : undefined}
                      >
                        {day}
                      </button>
                    )
                  })}
                </div>

                <p className="date-range-picker-hint">
                  {pendingStart
                    ? `De ${formatDateInputValue(pendingStart)} — selecione a data final`
                    : 'Selecione a data inicial'}
                </p>
              </>
            ) : (
              <>
                <div className="date-picker-header">
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => setView((v) => ({ ...v, year: v.year - 1 }))}
                    aria-label="Ano anterior"
                  >
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                      <path d="M10 3 5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <span className="date-picker-month-label">{view.year}</span>
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => setView((v) => ({ ...v, year: v.year + 1 }))}
                    aria-label="Próximo ano"
                  >
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                      <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>

                <div className="month-picker-grid">
                  {MONTH_LABELS.map((label, month) => {
                    const { from, to } = monthPeriod({ year: view.year, month })
                    const isSelected = value.from === from && value.to === to
                    const isInRange = !isSelected && from <= value.to && to >= value.from
                    return (
                      <button
                        type="button"
                        key={label}
                        className={[
                          'month-picker-month',
                          isSelected ? 'month-picker-month--selected' : '',
                          isInRange ? 'month-picker-month--in-range' : '',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                        onClick={() => pickMonth(month)}
                      >
                        {label}
                      </button>
                    )
                  })}
                </div>

                <p className="date-range-picker-hint">Selecione o mês inteiro</p>
              </>
            )}

            <div className="date-picker-footer date-range-picker-presets">
              {presets.map(({ label, period }) => {
                const isActive = period.from === value.from && period.to === value.to
                return (
                  <button
                    type="button"
                    key={label}
                    className={`date-picker-footer-btn${isActive ? ' date-range-picker-preset--active' : ''}`}
                    onClick={() => commit(period)}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </div>,
          document.body
        )}
    </div>
  )
}

export default DateRangePicker
