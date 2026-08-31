import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

// Accent-insensitive, case-insensitive normalization so "agua" matches "Água".
const DIACRITICS = new RegExp('[\\u0300-\\u036f]', 'g')
function normalize(text) {
  return text.normalize('NFD').replace(DIACRITICS, '').toLowerCase()
}

// Single-select dropdown with a search box, rendered in a portal so it escapes overflow
// containers and stays usable on small screens (long option lists are painful in a native
// <select> on mobile). Options: [{ value, label, group? }]; when any option has a `group`,
// the list is rendered with <optgroup>-style headers.
function SearchableSelect({ id, value, onChange, options, placeholder = 'Selecione…', disabled, ariaLabel }) {
  const [isOpen, setIsOpen] = useState(false)
  const [popoverStyle, setPopoverStyle] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)

  const wrapperRef = useRef(null)
  const popoverRef = useRef(null)
  const optionRefs = useRef([])

  const selectedOption = options.find((o) => String(o.value) === String(value)) ?? null
  const isGrouped = options.some((o) => o.group)

  const filtered = useMemo(() => {
    const query = normalize(searchTerm.trim())
    if (!query) return options
    return options.filter(
      (o) => normalize(o.label).includes(query) || (o.group && normalize(o.group).includes(query))
    )
  }, [options, searchTerm])

  const groups = useMemo(() => {
    if (!isGrouped) return [{ label: null, options: filtered }]
    const order = []
    const byLabel = new Map()
    filtered.forEach((option) => {
      const key = option.group ?? ''
      if (!byLabel.has(key)) {
        byLabel.set(key, [])
        order.push(key)
      }
      byLabel.get(key).push(option)
    })
    return order.map((label) => ({ label: label || null, options: byLabel.get(label) }))
  }, [filtered, isGrouped])

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
  }, [isOpen, filtered.length])

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

  useEffect(() => {
    if (isOpen) optionRefs.current[activeIndex]?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex, isOpen])

  const toggleOpen = () => {
    if (disabled) return
    if (isOpen) {
      setIsOpen(false)
      return
    }
    setPopoverStyle(null)
    setSearchTerm('')
    setActiveIndex(Math.max(filtered.findIndex((o) => String(o.value) === String(value)), 0))
    setIsOpen(true)
  }

  const choose = (option) => {
    onChange(String(option.value))
    setIsOpen(false)
  }

  const handleSearchKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (filtered[activeIndex]) choose(filtered[activeIndex])
    }
  }

  let flatIndex = -1

  return (
    <div className="searchable-select" ref={wrapperRef}>
      <button
        type="button"
        id={id}
        className="searchable-select-trigger"
        onClick={toggleOpen}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel}
      >
        <span
          className={`searchable-select-value${selectedOption ? '' : ' searchable-select-value--placeholder'}`}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg width="10" height="6" viewBox="0 0 10 6" fill="none" aria-hidden="true">
          <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {isOpen &&
        createPortal(
          <div className="date-picker-popover searchable-select-popover" style={popoverStyle} ref={popoverRef}>
            <input
              type="text"
              className="searchable-select-search"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setActiveIndex(0)
              }}
              onKeyDown={handleSearchKeyDown}
              autoFocus
            />
            <div className="searchable-select-list" role="listbox">
              {filtered.length === 0 && <p className="multi-select-empty">Nenhum resultado.</p>}
              {groups.map((group) => (
                <div key={group.label ?? '__ungrouped'}>
                  {group.label && <p className="searchable-select-group">{group.label}</p>}
                  {group.options.map((option) => {
                    flatIndex += 1
                    const index = flatIndex
                    const isSelected = String(option.value) === String(value)
                    return (
                      <button
                        type="button"
                        key={option.value}
                        ref={(el) => (optionRefs.current[index] = el)}
                        role="option"
                        aria-selected={isSelected}
                        className={[
                          'searchable-select-option',
                          index === activeIndex ? 'searchable-select-option--active' : '',
                          isSelected ? 'searchable-select-option--selected' : '',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                        onClick={() => choose(option)}
                        onMouseEnter={() => setActiveIndex(index)}
                      >
                        {option.label}
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>,
          document.body
        )}
    </div>
  )
}

export default SearchableSelect
