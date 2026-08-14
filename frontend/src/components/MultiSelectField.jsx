import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

function MultiSelectField({ id, allLabel, options, selected, onChange }) {
  const [isOpen, setIsOpen] = useState(false)
  const [popoverStyle, setPopoverStyle] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')

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

  const toggleOpen = () => {
    if (isOpen) {
      setIsOpen(false)
      return
    }
    setPopoverStyle(null)
    setSearchTerm('')
    setIsOpen(true)
  }

  const filteredOptions = searchTerm.trim()
    ? options.filter((option) => option.name.toLowerCase().includes(searchTerm.trim().toLowerCase()))
    : options

  const toggleValue = (value) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value))
    } else {
      onChange([...selected, value])
    }
  }

  const label =
    selected.length === 0
      ? allLabel
      : selected.length === 1
        ? options.find((o) => String(o.id) === selected[0])?.name ?? allLabel
        : `${selected.length} selecionados`

  return (
    <div className="multi-select" ref={wrapperRef}>
      <button
        type="button"
        id={id}
        className={`multi-select-trigger${selected.length > 0 ? ' multi-select-trigger--active' : ''}`}
        onClick={toggleOpen}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <span className="multi-select-trigger-label">{label}</span>
        <svg width="10" height="6" viewBox="0 0 10 6" fill="none" aria-hidden="true">
          <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {isOpen &&
        createPortal(
          <div className="date-picker-popover multi-select-popover" style={popoverStyle} ref={popoverRef}>
            {options.length > 0 && (
              <input
                type="text"
                className="multi-select-search"
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
              />
            )}
            <div className="multi-select-list">
              {filteredOptions.map((option) => {
                const value = String(option.id)
                return (
                  <label className="multi-select-option" key={option.id}>
                    <input
                      type="checkbox"
                      checked={selected.includes(value)}
                      onChange={() => toggleValue(value)}
                    />
                    {option.name}
                  </label>
                )
              })}
              {options.length === 0 && <p className="multi-select-empty">Nada cadastrado ainda.</p>}
              {options.length > 0 && filteredOptions.length === 0 && (
                <p className="multi-select-empty">Nenhum resultado.</p>
              )}
            </div>

            {selected.length > 0 && (
              <div className="date-picker-footer">
                <button type="button" className="date-picker-footer-btn" onClick={() => onChange([])}>
                  Limpar
                </button>
              </div>
            )}
          </div>,
          document.body
        )}
    </div>
  )
}

export default MultiSelectField
