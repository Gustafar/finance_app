function Drawer({ isOpen, onClose, children }) {
  return (
    <div
      className={`drawer-overlay${isOpen ? ' drawer-overlay--open' : ''}`}
      onClick={onClose}
      aria-hidden={!isOpen}
    >
      <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <span className="drawer-title">Menu</span>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Fechar menu">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export default Drawer
