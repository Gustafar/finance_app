function EyeIcon({ hidden }) {
  if (hidden) {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path
          d="M1.5 8s2.5-4.5 6.5-4.5c1.3 0 2.42.36 3.36.87M14.5 8s-.86 1.55-2.4 2.79M9.9 9.9A2 2 0 0 1 6.1 8.4"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M2 2l12 12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    )
  }

  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d="M1.5 8s2.5-4.5 6.5-4.5S14.5 8 14.5 8s-2.5 4.5-6.5 4.5S1.5 8 1.5 8Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  )
}

function VisibilityToggle({ hidden, onToggle, variant = 'icon' }) {
  const label = hidden ? 'Mostrar valores' : 'Ocultar valores'

  if (variant === 'drawer') {
    return (
      <button type="button" className="drawer-item" onClick={onToggle}>
        <EyeIcon hidden={hidden} />
        {label}
      </button>
    )
  }

  return (
    <button
      type="button"
      className="icon-btn icon-btn--header"
      onClick={onToggle}
      aria-label={label}
      title={label}
    >
      <EyeIcon hidden={hidden} />
    </button>
  )
}

export default VisibilityToggle
