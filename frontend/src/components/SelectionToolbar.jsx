function SelectionToolbar({ isSelecting, count, onToggle, onDeleteClick, panel = false, hideIdle = false, hideCancel = false }) {
  const className = `selection-toolbar${panel ? ' selection-toolbar--panel' : ''}${isSelecting ? ' selection-toolbar--active' : ''}`

  if (!isSelecting) {
    if (hideIdle) return null
    return (
      <div className={className}>
        <button type="button" className="btn btn-secondary btn-sm" onClick={onToggle}>
          Selecionar
        </button>
      </div>
    )
  }

  return (
    <div className={className}>
      <span className="selection-toolbar-count">
        {count} selecionado{count === 1 ? '' : 's'}
      </span>
      <div className="selection-toolbar-actions">
        {!hideCancel && (
          <button type="button" className="btn btn-secondary btn-sm" onClick={onToggle}>
            Cancelar
          </button>
        )}
        <button type="button" className="btn btn-danger btn-sm" onClick={onDeleteClick} disabled={count === 0}>
          Excluir selecionados
        </button>
      </div>
    </div>
  )
}

export default SelectionToolbar
