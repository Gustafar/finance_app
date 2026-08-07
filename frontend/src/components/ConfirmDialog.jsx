import Modal from './Modal'

function ConfirmDialog({ isOpen, title, message, confirmLabel = 'Confirmar', danger = false, onConfirm, onCancel }) {
  return (
    <Modal isOpen={isOpen} onClose={onCancel}>
      <div className="confirm-dialog">
        <h2>{title}</h2>
        <p className="confirm-dialog-message">{message}</p>
        <div className="confirm-dialog-actions">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            Cancelar
          </button>
          <button
            type="button"
            className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default ConfirmDialog
