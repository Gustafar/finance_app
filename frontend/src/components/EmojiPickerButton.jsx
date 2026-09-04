import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

const EmojiPicker = lazy(() => import('emoji-picker-react'))

function getEffectiveTheme() {
  const explicit = document.documentElement.getAttribute('data-theme')
  if (explicit === 'dark') return 'dark'
  if (explicit === 'light') return 'light'
  return 'auto'
}

function EmojiPickerButton({ onSelect, disabled, label = 'Inserir ícone' }) {
  const [isOpen, setIsOpen] = useState(false)
  const [popoverStyle, setPopoverStyle] = useState(null)

  const triggerRef = useRef(null)
  const popoverRef = useRef(null)

  useLayoutEffect(() => {
    if (!isOpen) return
    const triggerEl = triggerRef.current
    const popoverEl = popoverRef.current
    if (!triggerEl || !popoverEl) return

    const margin = 8
    const triggerRect = triggerEl.getBoundingClientRect()
    const popoverRect = popoverEl.getBoundingClientRect()

    const spaceBelow = window.innerHeight - triggerRect.bottom
    const openUpward = spaceBelow < popoverRect.height + margin

    let top = openUpward ? triggerRect.top - popoverRect.height - 4 : triggerRect.bottom + 4
    top = Math.min(Math.max(top, margin), window.innerHeight - popoverRect.height - margin)

    let left = triggerRect.right - popoverRect.width
    left = Math.min(Math.max(left, margin), window.innerWidth - popoverRect.width - margin)

    setPopoverStyle({ position: 'fixed', top, left, visibility: 'visible' })
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return

    const handlePointerDown = (e) => {
      if (triggerRef.current?.contains(e.target)) return
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
    setPopoverStyle(null)
    setIsOpen(true)
  }

  return (
    <>
      <button
        type="button"
        ref={triggerRef}
        className="icon-btn emoji-picker-trigger"
        onClick={toggleOpen}
        disabled={disabled}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label={label}
        title={label}
        tabIndex={-1}
      >
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="6.25" stroke="currentColor" strokeWidth="1.3" />
          <path d="M5.5 9.5s.9 1.3 2.5 1.3 2.5-1.3 2.5-1.3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          <path d="M5.75 6.5h.01M10.25 6.5h.01" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </button>

      {isOpen &&
        createPortal(
          <div className="date-picker-popover emoji-picker-popover" style={popoverStyle} ref={popoverRef}>
            <Suspense fallback={<div className="emoji-picker-loading" />}>
              <EmojiPicker
                onEmojiClick={(emojiData) => {
                  onSelect(emojiData.emoji)
                  setIsOpen(false)
                }}
                theme={getEffectiveTheme()}
                autoFocusSearch={false}
                lazyLoadEmojis
                previewConfig={{ showPreview: false }}
                width={300}
                height={380}
              />
            </Suspense>
          </div>,
          document.body
        )}
    </>
  )
}

export default EmojiPickerButton
