const LABELS = {
  system: 'Sistema',
  light: 'Claro',
  dark: 'Escuro',
}

function ThemeIcon({ theme }) {
  if (theme === 'light') {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.3" />
        <path
          d="M8 1.5v1.6M8 12.9v1.6M14.5 8h-1.6M3.1 8H1.5M12.4 3.6l-1.13 1.13M4.73 11.27 3.6 12.4M12.4 12.4l-1.13-1.13M4.73 4.73 3.6 3.6"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
        />
      </svg>
    )
  }

  if (theme === 'dark') {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path
          d="M13.5 9.3A5.8 5.8 0 1 1 6.7 2.5a4.6 4.6 0 0 0 6.8 6.8Z"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinejoin="round"
        />
      </svg>
    )
  }

  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="1.5" y="3" width="13" height="8.5" rx="1.2" stroke="currentColor" strokeWidth="1.3" />
      <path d="M5.5 14h5M8 11.5V14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

function ThemeToggle({ theme, onToggle, variant = 'icon' }) {
  if (variant === 'drawer') {
    return (
      <button type="button" className="drawer-item" onClick={onToggle}>
        <ThemeIcon theme={theme} />
        Tema: {LABELS[theme]}
      </button>
    )
  }

  return (
    <button
      type="button"
      className="icon-btn icon-btn--header"
      onClick={onToggle}
      aria-label={`Tema: ${LABELS[theme]} — clique para alternar`}
      title={`Tema: ${LABELS[theme]}`}
    >
      <ThemeIcon theme={theme} />
    </button>
  )
}

export default ThemeToggle
