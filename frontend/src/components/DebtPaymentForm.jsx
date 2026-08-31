import { useState } from 'react'
import DatePicker from './DatePicker'
import { addDebtPayment } from '../api/debts'
import { formatCurrency } from '../utils/format'
import { useVisibility } from '../hooks/useVisibility'
import { todayDateInputValue, dateInputValueToISOString } from '../utils/date'
import {
  isAmountFormula,
  isAmountInvalid,
  maskAmountInput,
  resolveAmountInput,
  normalizeAmountSeparators,
  formatAmountForDisplay,
} from '../utils/amountFormula'

function DebtPaymentForm({ debt, onSaved, onCancel }) {
  const { hidden } = useVisibility()
  const suggested = debt.outstanding > 0 ? debt.outstanding : 0

  const [amount, setAmount] = useState(suggested ? formatAmountForDisplay(suggested) : '')
  const [paidOn, setPaidOn] = useState(todayDateInputValue())
  const [comment, setComment] = useState('')
  const [attemptedSubmit, setAttemptedSubmit] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState(null)

  const resolvedAmount = resolveAmountInput(amount)
  const amountMissing = isAmountInvalid(resolvedAmount, { allowZero: false })
  const parsed = parseFloat(normalizeAmountSeparators(resolvedAmount))
  const remainingAfter = amountMissing ? debt.outstanding : debt.outstanding - parsed

  const handleSubmit = (e) => {
    e.preventDefault()
    setAttemptedSubmit(true)
    if (amountMissing || !paidOn) return

    setError(null)
    setIsSaving(true)

    addDebtPayment(debt.id, {
      amount: parsed,
      paid_on: dateInputValueToISOString(paidOn),
      ...(comment.trim() ? { comment: comment.trim() } : {}),
    })
      .then((saved) => onSaved(saved))
      .catch((err) => {
        console.error('Erro ao registrar pagamento:', err)
        setError('Não foi possível registrar o pagamento. Tente novamente.')
      })
      .finally(() => setIsSaving(false))
  }

  return (
    <form className="expense-form" onSubmit={handleSubmit}>
      <h2 className="modal-title">Registrar pagamento</h2>
      <p className="state-message" style={{ padding: 0, textAlign: 'left' }}>
        {debt.counterparty_name} · {debt.description}
        <br />
        Saldo em aberto: <strong>{formatCurrency(debt.outstanding, hidden)}</strong>
      </p>

      <div className="field-row">
        <div className={`field${attemptedSubmit && amountMissing ? ' field--error' : ''}`}>
          <label htmlFor="payment-amount">Valor recebido</label>
          <input
            id="payment-amount"
            type="text"
            inputMode="decimal"
            placeholder="0,00"
            value={amount}
            onChange={(e) => setAmount(maskAmountInput(e.target.value))}
            onBlur={(e) => setAmount(isAmountFormula(e.target.value) ? e.target.value : resolveAmountInput(e.target.value))}
          />
        </div>
        <div className={`field${attemptedSubmit && !paidOn ? ' field--error' : ''}`}>
          <label htmlFor="payment-date">Data</label>
          <DatePicker id="payment-date" value={paidOn} onChange={(e) => setPaidOn(e.target.value)} />
        </div>
      </div>

      <div className="field">
        <label htmlFor="payment-comment">Comentário (opcional)</label>
        <input
          id="payment-comment"
          type="text"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      </div>

      {!amountMissing && (
        <p className="state-message" style={{ padding: 0, textAlign: 'left' }}>
          {remainingAfter <= 0
            ? 'A dívida ficará quitada. 🎉'
            : `Restará ${formatCurrency(remainingAfter, hidden)} em aberto.`}
        </p>
      )}

      {error && <p className="form-error">{error}</p>}

      <div className="confirm-dialog-actions" style={{ marginTop: 8 }}>
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={isSaving}>
          Cancelar
        </button>
        <button type="submit" className="btn btn-primary" disabled={isSaving}>
          {isSaving ? 'Salvando…' : 'Registrar'}
        </button>
      </div>
    </form>
  )
}

export default DebtPaymentForm
