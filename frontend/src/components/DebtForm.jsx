import { useState } from 'react'
import DatePicker from './DatePicker'
import { createDebt, updateDebt } from '../api/debts'
import { todayDateInputValue, dateInputValueToISOString, isoStringToDateInputValue } from '../utils/date'
import {
  isAmountFormula,
  isAmountInvalid,
  maskAmountInput,
  resolveAmountInput,
  normalizeAmountSeparators,
  formatAmountForDisplay,
} from '../utils/amountFormula'

const DIRECTIONS = [
  { value: 'receivable', label: 'A receber' },
  { value: 'payable', label: 'A pagar' },
]

function DebtForm({ debt, defaultDirection = 'receivable', knownNames = [], onSaved, onCancel }) {
  const isEditing = Boolean(debt)

  const [direction, setDirection] = useState(debt?.direction ?? defaultDirection)
  const [name, setName] = useState(debt?.counterparty_name ?? '')
  const [description, setDescription] = useState(debt?.description ?? '')
  const [amount, setAmount] = useState(debt ? formatAmountForDisplay(debt.amount) : '')
  const [incurredOn, setIncurredOn] = useState(
    debt ? isoStringToDateInputValue(debt.incurred_on) : todayDateInputValue()
  )
  const [dueDate, setDueDate] = useState(debt?.due_date ? isoStringToDateInputValue(debt.due_date) : '')
  const [comment, setComment] = useState(debt?.comment ?? '')

  const [attemptedSubmit, setAttemptedSubmit] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState(null)

  const resolvedAmount = resolveAmountInput(amount)
  const amountMissing = isAmountInvalid(resolvedAmount, { allowZero: false })
  const isInvalid = !name.trim() || !description.trim() || !incurredOn || amountMissing

  const handleSubmit = (e) => {
    e.preventDefault()
    setAttemptedSubmit(true)
    if (isInvalid) return

    setError(null)
    setIsSaving(true)

    const payload = {
      direction,
      counterparty_name: name.trim(),
      description: description.trim(),
      amount: parseFloat(normalizeAmountSeparators(resolvedAmount)),
      incurred_on: dateInputValueToISOString(incurredOn),
      due_date: dueDate ? dateInputValueToISOString(dueDate) : null,
      ...(comment.trim() ? { comment: comment.trim() } : {}),
    }

    const request = isEditing ? updateDebt(debt.id, payload) : createDebt(payload)
    request
      .then((saved) => onSaved(saved))
      .catch((err) => {
        console.error('Erro ao salvar cobrança:', err)
        setError('Não foi possível salvar. Tente novamente.')
      })
      .finally(() => setIsSaving(false))
  }

  const errCls = (invalid) => `field${attemptedSubmit && invalid ? ' field--error' : ''}`

  return (
    <form className="expense-form" onSubmit={handleSubmit}>
      <h2 className="modal-title">{isEditing ? 'Editar cobrança' : 'Nova cobrança'}</h2>

      <div className="field">
        <label>Tipo</label>
        <div className="type-toggle" role="radiogroup" aria-label="Tipo de cobrança">
          {DIRECTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={direction === option.value}
              className={`type-toggle-option${direction === option.value ? ' type-toggle-option--selected' : ''}`}
              onClick={() => setDirection(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className={errCls(!name.trim())}>
        <label htmlFor="debt-name">{direction === 'receivable' ? 'Quem está devendo' : 'Para quem devemos'}</label>
        <input
          id="debt-name"
          type="text"
          list="debt-known-names"
          placeholder="Ex: João"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <datalist id="debt-known-names">
          {knownNames.map((known) => (
            <option key={known} value={known} />
          ))}
        </datalist>
      </div>

      <div className={errCls(!description.trim())}>
        <label htmlFor="debt-description">Descrição</label>
        <input
          id="debt-description"
          type="text"
          placeholder="Ex: Almoço, empréstimo"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="field-row">
        <div className={errCls(amountMissing)}>
          <label htmlFor="debt-amount">Valor</label>
          <input
            id="debt-amount"
            type="text"
            inputMode="decimal"
            placeholder="0,00 (ou =10+5,50)"
            value={amount}
            onChange={(e) => setAmount(maskAmountInput(e.target.value))}
            onBlur={(e) => setAmount(isAmountFormula(e.target.value) ? e.target.value : resolveAmountInput(e.target.value))}
          />
        </div>
        <div className={errCls(!incurredOn)}>
          <label htmlFor="debt-incurred">Data</label>
          <DatePicker id="debt-incurred" value={incurredOn} onChange={(e) => setIncurredOn(e.target.value)} />
        </div>
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor="debt-due">Vencimento (opcional)</label>
          <DatePicker id="debt-due" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="debt-comment">Comentário (opcional)</label>
          <input
            id="debt-comment"
            type="text"
            placeholder="Ex: combinado de pagar em 2x"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </div>
      </div>

      {attemptedSubmit && isInvalid && (
        <p className="form-error">Preencha os campos destacados antes de continuar.</p>
      )}
      {error && <p className="form-error">{error}</p>}

      <div className="confirm-dialog-actions" style={{ marginTop: 8 }}>
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={isSaving}>
          Cancelar
        </button>
        <button type="submit" className="btn btn-primary" disabled={isSaving}>
          {isSaving ? 'Salvando…' : 'Salvar'}
        </button>
      </div>
    </form>
  )
}

export default DebtForm
