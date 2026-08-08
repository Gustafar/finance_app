function RefreshButton({ onClick, isRefreshing, className }) {
  return (
    <button
      type="button"
      className={`icon-btn refresh-btn${className ? ` ${className}` : ''}`}
      onClick={onClick}
      disabled={isRefreshing}
      aria-label="Atualizar"
      title="Atualizar"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        className={isRefreshing ? 'refresh-btn-icon refresh-btn-icon--spinning' : 'refresh-btn-icon'}
      >
        <path
          d="M13.5 8A5.5 5.5 0 1 1 11.9 4.1"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
        <path d="M12 1.8v3h-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  )
}

export default RefreshButton
