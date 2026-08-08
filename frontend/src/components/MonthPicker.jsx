import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { currentYearMonth, formatMonthLabel } from '../utils/date'

const MONTH_LABELS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

function MonthPicker({ value, onChange, disabled }) {
  const [isOpen, setIsOpen] = useState(false)
  const [popoverStyle, setPopoverStyle] = useState(null)
  const [viewYear, setViewYear] = useState(value.year)

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

    let left = wrapperRect.left - (popoverRect.width - wrapperRect.width) / 2
    left = Math.min(Math.max(left, margin), window.innerWidth - popoverRect.width - margin)

    setPopoverStyle({ position: 'fixed', top, left, visibility: 'visible' })
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

  const toggleOpen = () => {
    if (disabled) return
    if (isOpen) {
      setIsOpen(false)
      return
    }
    setViewYear(value.year)
    setPopoverStyle(null)
    setIsOpen(true)
  }

  const pickMonth = (month) => {
    onChange({ year: viewYear, month })
    setIsOpen(false)
  }

  const selectCurrentMonth = () => {
    onChange(currentYearMonth())
    setIsOpen(false)
  }

  return (
    <div className="month-picker" ref={wrapperRef}>
      <button
        type="button"
        className="month-picker-trigger"
        onClick={toggleOpen}
        disabled={disabled}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        {formatMonthLabel(value)}
      </button>

      {isOpen &&
        createPortal(
          <div className="date-picker-popover month-picker-popover" style={popoverStyle} ref={popoverRef}>
            <div className="date-picker-header">
              <button
                type="button"
                className="icon-btn"
                onClick={() => setViewYear((y) => y - 1)}
                aria-label="Ano anterior"
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M10 3 5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <span className="date-picker-month-label">{viewYear}</span>
              <button
                type="button"
                className="icon-btn"
                onClick={() => setViewYear((y) => y + 1)}
                aria-label="Próximo ano"
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>

            <div className="month-picker-grid">
              {MONTH_LABELS.map((label, month) => {
                const isSelected = value.year === viewYear && value.month === month
                return (
                  <button
                    type="button"
                    key={label}
                    className={`month-picker-month${isSelected ? ' month-picker-month--selected' : ''}`}
                    onClick={() => pickMonth(month)}
                  >
                    {label}
                  </button>
                )
              })}
            </div>

            <div className="date-picker-footer">
              <button type="button" className="date-picker-footer-btn" onClick={selectCurrentMonth}>
                Mês atual
              </button>
            </div>
          </div>,
          document.body
        )}
    </div>
  )
}

export default MonthPicker
