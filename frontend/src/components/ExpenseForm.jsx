import { useState, useMemo } from 'react'
import { createExpense, createInstallmentPurchase } from '../api/expenses'
import DatePicker from './DatePicker'
import { useCategories } from '../hooks/useCategories'
import { usePeople } from '../hooks/usePeople'
import { usePaymentMethods } from '../hooks/usePaymentMethods'
import { useBuckets } from '../hooks/useBuckets'
import { useBanks } from '../hooks/useBanks'
import { useInvestmentBoxes } from '../hooks/useInvestmentBoxes'
import { TRANSACTION_TYPES } from '../utils/transactionTypes'
import { todayDateInputValue, dateInputValueToISOString } from '../utils/date'

function ExpenseForm({ onExpenseCreated }) {
  const { categories, isLoading: isLoadingCategories } = useCategories()
  const { people, isLoading: isLoadingPeople } = usePeople()
  const { paymentMethods, isLoading: isLoadingPaymentMethods } = usePaymentMethods()
  const { buckets, isLoading: isLoadingBuckets } = useBuckets()
  const { banks, isLoading: isLoadingBanks } = useBanks()
  const { investmentBoxes, isLoading: isLoadingInvestmentBoxes } = useInvestmentBoxes()

  const [type, setType] = useState('expense')
  const [isInstallment, setIsInstallment] = useState(false)
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [totalAmount, setTotalAmount] = useState('')
  const [installmentCount, setInstallmentCount] = useState('2')
  const [date, setDate] = useState(todayDateInputValue)
  const [categoryId, setCategoryId] = useState('')
  const [personId, setPersonId] = useState('')
  const [paymentMethodId, setPaymentMethodId] = useState('')
  const [bucketId, setBucketId] = useState('')
  const [bankId, setBankId] = useState('')
  const [investmentBoxId, setInvestmentBoxId] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const noCategories = !isLoadingCategories && categories.length === 0

  const defaultPersonId = useMemo(() => {
    const defaultPerson = people.find((p) => p.is_default)
    return defaultPerson ? String(defaultPerson.id) : people[0] ? String(people[0].id) : ''
  }, [people])

  const effectivePersonId = personId || defaultPersonId

  const defaultBucketId = useMemo(() => {
    const defaultBucket = buckets.find((c) => c.is_default)
    return defaultBucket ? String(defaultBucket.id) : buckets[0] ? String(buckets[0].id) : ''
  }, [buckets])

  const effectiveBucketId = bucketId || defaultBucketId

  const defaultBankId = useMemo(() => {
    const defaultBank = banks.find((b) => b.is_default)
    return defaultBank ? String(defaultBank.id) : banks[0] ? String(banks[0].id) : ''
  }, [banks])

  const effectiveBankId = bankId || defaultBankId

  const defaultInvestmentBoxId = useMemo(() => {
    const defaultBox = investmentBoxes.find((b) => b.is_default)
    return defaultBox ? String(defaultBox.id) : investmentBoxes[0] ? String(investmentBoxes[0].id) : ''
  }, [investmentBoxes])

  const effectiveInvestmentBoxId = investmentBoxId || defaultInvestmentBoxId

  const handleTypeChange = (nextType) => {
    setType(nextType)
    if (nextType !== 'expense') {
      setIsInstallment(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    const shared = {
      description,
      category_id: Number(categoryId),
      person_id: Number(effectivePersonId),
      payment_method_id: Number(paymentMethodId),
      bucket_id: Number(effectiveBucketId),
      bank_id: Number(effectiveBankId),
    }

    const request = isInstallment
      ? createInstallmentPurchase({
          ...shared,
          total_amount: parseFloat(totalAmount),
          installment_count: Number(installmentCount),
          purchase_date: dateInputValueToISOString(date),
        })
      : createExpense({
          ...shared,
          amount: parseFloat(amount),
          type,
          date: dateInputValueToISOString(date),
          ...(type === 'investment' ? { investment_box_id: Number(effectiveInvestmentBoxId) } : {}),
        })

    request
      .then((created) => {
        onExpenseCreated(created)
        setDescription('')
        setAmount('')
        setTotalAmount('')
        setInstallmentCount('2')
        setDate(todayDateInputValue())
        setCategoryId('')
        setInvestmentBoxId('')
        setIsInstallment(false)
      })
      .catch((err) => {
        console.error('Erro ao criar transação:', err)
        setError('Não foi possível salvar a transação. Tente novamente.')
      })
      .finally(() => setIsSubmitting(false))
  }

  const isAmountMissing = isInstallment ? !totalAmount || !installmentCount : !amount

  return (
    <form className="expense-form" onSubmit={handleSubmit}>
      <h2>Nova transação</h2>

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
              onClick={() => handleTypeChange(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <label htmlFor="description">Descrição</label>
        <input
          id="description"
          type="text"
          placeholder="Ex: Supermercado"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
      </div>

      {type === 'expense' && (
        <label className="checkbox-field">
          <input
            type="checkbox"
            checked={isInstallment}
            onChange={(e) => setIsInstallment(e.target.checked)}
          />
          É uma compra parcelada?
        </label>
      )}

      {isInstallment ? (
        <>
          <div className="field-row">
            <div className="field">
              <label htmlFor="total-amount">Valor total</label>
              <input
                id="total-amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="installment-count">Nº de parcelas</label>
              <input
                id="installment-count"
                type="number"
                min="2"
                max="60"
                value={installmentCount}
                onChange={(e) => setInstallmentCount(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="purchase-date">Data da compra</label>
              <DatePicker id="purchase-date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>

            <div className="field">
              <label htmlFor="category">Categoria</label>
              <select
                id="category"
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
        </>
      ) : (
        <div className="field-row">
          <div className="field">
            <label htmlFor="amount">Valor</label>
            <input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              placeholder="0,00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="date">Data</label>
            <DatePicker id="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>

          <div className="field">
            <label htmlFor="category">Categoria</label>
            <select
              id="category"
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
      )}

      <div className="field-row">
        <div className="field">
          <label htmlFor="person">Responsável</label>
          <select
            id="person"
            value={effectivePersonId}
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
          <label htmlFor="payment-method">Método de pagamento</label>
          <select
            id="payment-method"
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
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor="bucket">Envelope</label>
          <select
            id="bucket"
            value={effectiveBucketId}
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

        <div className="field">
          <label htmlFor="bank">Banco</label>
          <select
            id="bank"
            value={effectiveBankId}
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
      </div>

      {type === 'investment' && (
        <div className="field">
          <label htmlFor="investment-box">Caixinha de investimento</label>
          <select
            id="investment-box"
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

      {noCategories && (
        <p className="form-error">Cadastre uma categoria em "Categorias" antes de adicionar despesas.</p>
      )}

      {error && <p className="form-error">{error}</p>}

      <button
        type="submit"
        className="btn btn-primary"
        disabled={
          isSubmitting ||
          noCategories ||
          !categoryId ||
          !effectivePersonId ||
          !paymentMethodId ||
          !effectiveBucketId ||
          !effectiveBankId ||
          (type === 'investment' && !effectiveInvestmentBoxId) ||
          isAmountMissing
        }
      >
        {isSubmitting ? 'Salvando…' : 'Adicionar transação'}
      </button>
    </form>
  )
}

export default ExpenseForm
