import { useState, useMemo } from 'react'
import { updateExpense } from '../api/expenses'
import { useCategories } from '../hooks/useCategories'
import { usePeople } from '../hooks/usePeople'
import { usePaymentMethods } from '../hooks/usePaymentMethods'
import { useBuckets } from '../hooks/useBuckets'
import { useBanks } from '../hooks/useBanks'
import { useInvestmentBoxes } from '../hooks/useInvestmentBoxes'
import { TRANSACTION_TYPES } from '../utils/transactionTypes'
import ConfirmDialog from './ConfirmDialog'

function ExpenseEditForm({ expense, onExpenseUpdated }) {
  const { categories, isLoading: isLoadingCategories } = useCategories()
  const { people, isLoading: isLoadingPeople } = usePeople()
  const { paymentMethods, isLoading: isLoadingPaymentMethods } = usePaymentMethods()
  const { buckets, isLoading: isLoadingBuckets } = useBuckets()
  const { banks, isLoading: isLoadingBanks } = useBanks()
  const { investmentBoxes, isLoading: isLoadingInvestmentBoxes } = useInvestmentBoxes()

  const [type, setType] = useState(expense.type)
  const [description, setDescription] = useState(expense.description)
  const [amount, setAmount] = useState(expense.amount)
  const [categoryId, setCategoryId] = useState(String(expense.category_id))
  const [personId, setPersonId] = useState(String(expense.person_id))
  const [paymentMethodId, setPaymentMethodId] = useState(String(expense.payment_method_id))
  const [bucketId, setBucketId] = useState(String(expense.bucket_id))
  const [bankId, setBankId] = useState(String(expense.bank_id))
  const [investmentBoxId, setInvestmentBoxId] = useState(
    expense.investment_box_id ? String(expense.investment_box_id) : ''
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [attemptedSubmit, setAttemptedSubmit] = useState(false)

  const noCategories = !isLoadingCategories && categories.length === 0

  const defaultInvestmentBoxId = useMemo(() => {
    const defaultBox = investmentBoxes.find((b) => b.is_default)
    return defaultBox ? String(defaultBox.id) : investmentBoxes[0] ? String(investmentBoxes[0].id) : ''
  }, [investmentBoxes])

  const effectiveInvestmentBoxId = investmentBoxId || defaultInvestmentBoxId

  const isFormInvalid =
    !description.trim() ||
    !amount ||
    !categoryId ||
    !personId ||
    !paymentMethodId ||
    !bucketId ||
    !bankId ||
    (type === 'investment' && !effectiveInvestmentBoxId)

  const handleSubmit = (e) => {
    e.preventDefault()
    setAttemptedSubmit(true)

    if (noCategories || isFormInvalid) return

    setShowConfirm(true)
  }

  const performUpdate = () => {
    setShowConfirm(false)
    setError(null)
    setIsSubmitting(true)

    const updatedExpense = {
      description,
      amount: parseFloat(amount),
      type,
      category_id: Number(categoryId),
      person_id: Number(personId),
      payment_method_id: Number(paymentMethodId),
      bucket_id: Number(bucketId),
      bank_id: Number(bankId),
      date: expense.date,
      ...(type === 'investment' ? { investment_box_id: Number(effectiveInvestmentBoxId) } : {}),
    }

    updateExpense(expense.id, updatedExpense)
      .then((data) => onExpenseUpdated(data))
      .catch((err) => {
        console.error('Erro ao atualizar despesa:', err)
        setError('Não foi possível salvar as alterações. Tente novamente.')
      })
      .finally(() => setIsSubmitting(false))
  }

  return (
    <>
      <form className="expense-form" onSubmit={handleSubmit}>
        <h2>Editar despesa</h2>

        <div className="field">
          <label>Tipo</label>
          <div className="type-toggle" role="radiogroup" aria-label="Tipo de transação">
            {TRANSACTION_TYPES.map((option) => (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={type === option.value}
                className={`type-toggle-option${type === option.value ? ' type-toggle-option--selected' : ''}`}
                onClick={() => setType(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className={`field${attemptedSubmit && !description.trim() ? ' field--error' : ''}`}>
          <label htmlFor="edit-description">Descrição</label>
          <input
            id="edit-description"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>

        <div className="field-row">
          <div className={`field${attemptedSubmit && !amount ? ' field--error' : ''}`}>
            <label htmlFor="edit-amount">Valor</label>
            <input
              id="edit-amount"
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className={`field${attemptedSubmit && !categoryId ? ' field--error' : ''}`}>
            <label htmlFor="edit-category">Categoria</label>
            <select
              id="edit-category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
              disabled={noCategories}
            >
              <option value="" disabled>Selecione…</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className={`field${attemptedSubmit && !personId ? ' field--error' : ''}`}>
          <label htmlFor="edit-person">Responsável</label>
          <select
            id="edit-person"
            value={personId}
            onChange={(e) => setPersonId(e.target.value)}
            required
            disabled={isLoadingPeople}
          >
            <option value="" disabled>Selecione…</option>
            {people.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div className={`field${attemptedSubmit && !paymentMethodId ? ' field--error' : ''}`}>
          <label htmlFor="edit-payment-method">Método de pagamento</label>
          <select
            id="edit-payment-method"
            value={paymentMethodId}
            onChange={(e) => setPaymentMethodId(e.target.value)}
            required
            disabled={isLoadingPaymentMethods}
          >
            <option value="" disabled>Selecione…</option>
            {paymentMethods.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>

        <div className={`field${attemptedSubmit && !bucketId ? ' field--error' : ''}`}>
          <label htmlFor="edit-bucket">Envelope</label>
          <select
            id="edit-bucket"
            value={bucketId}
            onChange={(e) => setBucketId(e.target.value)}
            required
            disabled={isLoadingBuckets}
          >
            <option value="" disabled>Selecione…</option>
            {buckets.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className={`field${attemptedSubmit && !bankId ? ' field--error' : ''}`}>
          <label htmlFor="edit-bank">Banco</label>
          <select
            id="edit-bank"
            value={bankId}
            onChange={(e) => setBankId(e.target.value)}
            required
            disabled={isLoadingBanks}
          >
            <option value="" disabled>Selecione…</option>
            {banks.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>

        {type === 'investment' && (
          <div className={`field${attemptedSubmit && !effectiveInvestmentBoxId ? ' field--error' : ''}`}>
            <label htmlFor="edit-investment-box">Caixinha de investimento</label>
            <select
              id="edit-investment-box"
              value={effectiveInvestmentBoxId}
              onChange={(e) => setInvestmentBoxId(e.target.value)}
              required
              disabled={isLoadingInvestmentBoxes}
            >
              <option value="" disabled>Selecione…</option>
              {investmentBoxes.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
        )}

        {attemptedSubmit && isFormInvalid && (
          <p className="form-error">Preencha os campos destacados antes de continuar.</p>
        )}

        {error && <p className="form-error">{error}</p>}

        <button type="submit" className="btn btn-primary" disabled={isSubmitting || noCategories}>
          {isSubmitting ? 'Salvando…' : 'Salvar alterações'}
        </button>
      </form>

      <ConfirmDialog
        isOpen={showConfirm}
        title="Salvar alterações"
        message="Confirma as alterações nesta transação?"
        confirmLabel="Salvar"
        onConfirm={performUpdate}
        onCancel={() => setShowConfirm(false)}
      />
    </>
  )
}

export default ExpenseEditForm
