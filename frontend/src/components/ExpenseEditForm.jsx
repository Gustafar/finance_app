import { useState } from 'react'
import { updateExpense } from '../api/expenses'
import { useCategories } from '../hooks/useCategories'
import { usePeople } from '../hooks/usePeople'
import { usePaymentMethods } from '../hooks/usePaymentMethods'
import { useCaixinhas } from '../hooks/useCaixinhas'
import { useBanks } from '../hooks/useBanks'
import { TRANSACTION_TYPES } from '../utils/transactionTypes'

function ExpenseEditForm({ expense, onExpenseUpdated }) {
  const { categories, isLoading: isLoadingCategories } = useCategories()
  const { people, isLoading: isLoadingPeople } = usePeople()
  const { paymentMethods, isLoading: isLoadingPaymentMethods } = usePaymentMethods()
  const { caixinhas, isLoading: isLoadingCaixinhas } = useCaixinhas()
  const { banks, isLoading: isLoadingBanks } = useBanks()

  const [type, setType] = useState(expense.type)
  const [description, setDescription] = useState(expense.description)
  const [amount, setAmount] = useState(expense.amount)
  const [categoryId, setCategoryId] = useState(String(expense.category_id))
  const [personId, setPersonId] = useState(String(expense.person_id))
  const [paymentMethodId, setPaymentMethodId] = useState(String(expense.payment_method_id))
  const [caixinhaId, setCaixinhaId] = useState(String(expense.caixinha_id))
  const [bankId, setBankId] = useState(String(expense.bank_id))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const noCategories = !isLoadingCategories && categories.length === 0

  const handleSubmit = (e) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    const updatedExpense = {
      description,
      amount: parseFloat(amount),
      type,
      category_id: Number(categoryId),
      person_id: Number(personId),
      payment_method_id: Number(paymentMethodId),
      caixinha_id: Number(caixinhaId),
      bank_id: Number(bankId),
      date: expense.date,
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

      <div className="field">
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
        <div className="field">
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

        <div className="field">
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

      <div className="field">
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

      <div className="field">
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

      <div className="field">
        <label htmlFor="edit-caixinha">Caixinha</label>
        <select
          id="edit-caixinha"
          value={caixinhaId}
          onChange={(e) => setCaixinhaId(e.target.value)}
          required
          disabled={isLoadingCaixinhas}
        >
          <option value="" disabled>Selecione…</option>
          {caixinhas.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className="field">
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

      {error && <p className="form-error">{error}</p>}

      <button
        type="submit"
        className="btn btn-primary"
        disabled={isSubmitting || noCategories || !categoryId || !personId || !paymentMethodId || !caixinhaId || !bankId}
      >
        {isSubmitting ? 'Salvando…' : 'Salvar alterações'}
      </button>
    </form>
  )
}

export default ExpenseEditForm
