import { useState } from 'react'
import Modal from './Modal'

const SCOPE_OPTIONS = [
  { value: 'this', label: 'Somente esta parcela', description: 'Aplica a alteração apenas na parcela selecionada.' },
  { value: 'future', label: 'Esta e as parcelas futuras', description: 'Aplica a alteração nesta parcela e em todas as que vêm depois dela.' },
  { value: 'all', label: 'Todas as parcelas', description: 'Aplica a alteração em todas as parcelas deste parcelamento.' },
]

function InstallmentScopeDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirmar',
  danger = false,
  isConfirming = false,
  onConfirm,
  onCancel,
}) {
  const [scope, setScope] = useState('this')

  const handleCancel = () => {
    setScope('this')
    onCancel()
  }

  return (
    <Modal isOpen={isOpen} onClose={isConfirming ? () => {} : handleCancel}>
      <div className="confirm-dialog">
        <h2>{title}</h2>
        {message && <p className="confirm-dialog-message">{message}</p>}

        <div className="scope-options" role="radiogroup" aria-label="Alcance da alteração">
          {SCOPE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={scope === option.value}
              className={`scope-option${scope === option.value ? ' scope-option--selected' : ''}`}
              onClick={() => setScope(option.value)}
            >
              <span className="scope-option-label">{option.label}</span>
              <span className="scope-option-description">{option.description}</span>
            </button>
          ))}
        </div>

        <div className="confirm-dialog-actions">
          <button type="button" className="btn btn-secondary" onClick={handleCancel} disabled={isConfirming}>
            Cancelar
          </button>
          <button
            type="button"
            className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`}
            onClick={() => onConfirm(scope)}
            disabled={isConfirming}
          >
            {isConfirming ? 'Processando…' : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default InstallmentScopeDialog
