import { useState } from 'react'
import Modal from './Modal'
import DatePicker from './DatePicker'
import { todayDateInputValue } from '../utils/date'

function AnticipateInstallmentsDialog({ isOpen, maxDate, remainingCount, isConfirming = false, onConfirm, onCancel }) {
  const [date, setDate] = useState(() => todayDateInputValue())
  const [count, setCount] = useState(remainingCount)

  const reset = () => {
    setDate(todayDateInputValue())
    setCount(remainingCount)
  }

  const handleCancel = () => {
    reset()
    onCancel()
  }

  const isDateInvalid = !date || (maxDate && date > maxDate)
  const isCountInvalid = !count || count < 1 || count > remainingCount
  const isInvalid = isDateInvalid || isCountInvalid

  return (
    <Modal isOpen={isOpen} onClose={isConfirming ? () => {} : handleCancel}>
      <div className="confirm-dialog">
        <h2>Antecipar parcelas</h2>
        <p className="confirm-dialog-message">
          Escolha quantas parcelas a partir desta antecipar e para quando. As parcelas seguintes que não forem
          antecipadas serão adiantadas para os meses seguintes, sem deixar intervalo.
        </p>

        <div className={`field${isCountInvalid ? ' field--error' : ''}`}>
          <label htmlFor="anticipate-count">Quantidade de parcelas</label>
          <input
            id="anticipate-count"
            type="number"
            min={1}
            max={remainingCount}
            value={count}
            onChange={(e) => setCount(e.target.value === '' ? '' : Number(e.target.value))}
          />
        </div>

        <div className={`field${isDateInvalid ? ' field--error' : ''}`}>
          <label htmlFor="anticipate-date">Nova data</label>
          <DatePicker id="anticipate-date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>

        {maxDate && date > maxDate && (
          <p className="form-error">A nova data não pode ser depois da data original da parcela.</p>
        )}
        {isCountInvalid && (
          <p className="form-error">Escolha entre 1 e {remainingCount} parcela{remainingCount === 1 ? '' : 's'}.</p>
        )}

        <div className="confirm-dialog-actions">
          <button type="button" className="btn btn-secondary" onClick={handleCancel} disabled={isConfirming}>
            Cancelar
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => onConfirm(date, count)}
            disabled={isConfirming || isInvalid}
          >
            {isConfirming ? 'Processando…' : 'Antecipar'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default AnticipateInstallmentsDialog
