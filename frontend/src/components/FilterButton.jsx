function FilterButton({ onClick, active, className }) {
  return (
    <button
      type="button"
      className={`icon-btn filter-trigger-btn${active ? ' filter-trigger-btn--active' : ''}${className ? ` ${className}` : ''}`}
      onClick={onClick}
      aria-label="Filtros"
      title="Filtros"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M2 4h12M4.5 8h7M7 12h2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
      {active && <span className="filter-trigger-dot" aria-hidden="true" />}
    </button>
  )
}

export default FilterButton
