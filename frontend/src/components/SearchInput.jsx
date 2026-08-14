function SearchInput({ value, onChange, placeholder = 'Buscar por nome...' }) {
  return (
    <div className="search-input">
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.4" />
        <path d="M11 11l3.5 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label="Buscar por nome"
      />
    </div>
  )
}

export default SearchInput
