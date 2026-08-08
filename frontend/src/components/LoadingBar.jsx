function LoadingBar({ variant = 'page' }) {
  return (
    <div className={`loading-bar loading-bar--${variant}`} role="status" aria-label="Carregando">
      <div className="loading-bar-fill" />
    </div>
  )
}

export default LoadingBar
