import { useRef } from 'react'
import EmojiPickerButton from './EmojiPickerButton'

function EmojiTextInput({ value, onChange, disabled, ...inputProps }) {
  const inputRef = useRef(null)

  const insertEmoji = (emoji) => {
    const el = inputRef.current
    const start = el?.selectionStart ?? value.length
    const end = el?.selectionEnd ?? value.length
    const next = value.slice(0, start) + emoji + value.slice(end)
    onChange(next)

    requestAnimationFrame(() => {
      if (!el) return
      el.focus()
      const pos = start + emoji.length
      el.setSelectionRange(pos, pos)
    })
  }

  return (
    <div className="text-input-with-emoji">
      <input
        {...inputProps}
        ref={inputRef}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      />
      <EmojiPickerButton onSelect={insertEmoji} disabled={disabled} />
    </div>
  )
}

export default EmojiTextInput
