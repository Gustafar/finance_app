import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { formatMonthLabel, shiftMonth, parseFlexibleDateInput, formatDateInputValue } from '../utils/date'

const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

function todayParts() {
  const now = new Date()
  return { year: now.getFullYear(), month: now.getMonth(), day: now.getDate() }
}

function toISODate(year, month, day) {
  return `${String(year).padStart(4, '0')}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function buildMonthGrid(year, month) {
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

function DatePicker({ id, value, onChange, onPaste, required, disabled }) {
  const [text, setText] = useState(() => formatDateInputValue(value))
  const [lastSyncedValue, setLastSyncedValue] = useState(value)
  const [isOpen, setIsOpen] = useState(false)
  const [popoverStyle, setPopoverStyle] = useState(null)
  const [view, setView] = useState(() => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value || '')) {
      const [year, month] = value.split('-').map(Number)
      return { year, month: month - 1 }
    }
    const today = todayParts()
    return { year: today.year, month: today.month }
  })

  const wrapperRef = useRef(null)
  const popoverRef = useRef(null)

  if (value !== lastSyncedValue) {
    setLastSyncedValue(value)
    setText(formatDateInputValue(value))
  }

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

    let left = wrapperRect.left
    left = Math.min(Math.max(left, margin), window.innerWidth - popoverRect.width - margin)

    setPopoverStyle({ position: 'fixed', top, left, minWidth: wrapperRect.width, visibility: 'visible' })
  }, [isOpen])

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

  const commit = (isoValue) => {
    onChange({ target: { value: isoValue } })
  }

  const openPopover = () => {
    if (disabled) return

    if (/^\d{4}-\d{2}-\d{2}$/.test(value || '')) {
      const [year, month] = value.split('-').map(Number)
      setView({ year, month: month - 1 })
    } else {
      const today = todayParts()
      setView({ year: today.year, month: today.month })
    }

    setPopoverStyle(null)
    setIsOpen(true)
  }

  const toggleOpen = () => {
    if (isOpen) setIsOpen(false)
    else openPopover()
  }

  const handleTextBlur = () => {
    const parsed = parseFlexibleDateInput(text)
    if (parsed !== value) commit(parsed)
    setText(formatDateInputValue(parsed))
  }

  const handleTextKeyDown = (e) => {
    if (e.key === 'Enter') e.currentTarget.blur()
  }

  const pickDay = (year, month, day) => {
    commit(toISODate(year, month, day))
    setIsOpen(false)
  }

  const selectToday = () => {
    const today = todayParts()
    pickDay(today.year, today.month, today.day)
  }

  const clear = () => {
    commit('')
    setIsOpen(false)
  }

  const today = todayParts()
  const selected = /^\d{4}-\d{2}-\d{2}$/.test(value || '') ? value.split('-').map(Number) : null
  const cells = buildMonthGrid(view.year, view.month)

  return (
    <div className="date-picker" ref={wrapperRef}>
      <input
        id={id}
        type="text"
        className="date-picker-input"
        placeholder="DD/MM/AAAA"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={handleTextBlur}
        onKeyDown={handleTextKeyDown}
        onPaste={onPaste}
        required={required}
        disabled={disabled}
      />
      <button
        type="button"
        className="date-picker-toggle"
        onClick={toggleOpen}
        disabled={disabled}
        aria-label="Abrir calendário"
      >
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
          <path
            d="M5 2.2v2.3M11 2.2v2.3M2.8 6.3h10.4M3.8 3.6h8.4a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H3.8a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {isOpen &&
        createPortal(
          <div className="date-picker-popover" style={popoverStyle} ref={popoverRef}>
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
              <span className="date-picker-month-label">{formatMonthLabel(view)}</span>
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

            <div className="date-picker-grid">
              {cells.map(({ day, monthOffset }, index) => {
                const cellMonth = view.month + monthOffset
                const cellDate = new Date(view.year, cellMonth, day)
                const isSelected =
                  selected && selected[0] === cellDate.getFullYear() && selected[1] === cellDate.getMonth() + 1 && selected[2] === day
                const isToday =
                  today.year === cellDate.getFullYear() && today.month === cellDate.getMonth() && today.day === day

                return (
                  <button
                    type="button"
                    key={index}
                    className={[
                      'date-picker-day',
                      monthOffset !== 0 ? 'date-picker-day--muted' : '',
                      isSelected ? 'date-picker-day--selected' : '',
                      isToday && !isSelected ? 'date-picker-day--today' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onClick={() => pickDay(cellDate.getFullYear(), cellDate.getMonth(), day)}
                  >
                    {day}
                  </button>
                )
              })}
            </div>

            <div className="date-picker-footer">
              <button type="button" className="date-picker-footer-btn" onClick={selectToday}>
                Hoje
              </button>
              <button type="button" className="date-picker-footer-btn" onClick={clear}>
                Limpar
              </button>
            </div>
          </div>,
          document.body
        )}
    </div>
  )
}

export default DatePicker
