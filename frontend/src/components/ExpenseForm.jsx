import { useState, useMemo } from 'react'
import { createExpense, createInstallmentPurchase } from '../api/expenses'
import DatePicker from './DatePicker'
import LoadingBar from './LoadingBar'
import SubcategorySelect from './SubcategorySelect'
import { useCategories } from '../hooks/useCategories'
import { useSubcategories } from '../hooks/useSubcategories'
import { usePeople } from '../hooks/usePeople'
import { usePaymentMethods } from '../hooks/usePaymentMethods'
import { useBuckets } from '../hooks/useBuckets'
import { useBanks } from '../hooks/useBanks'
import { useInvestmentBoxes } from '../hooks/useInvestmentBoxes'
import { TRANSACTION_TYPES } from '../utils/transactionTypes'
import { todayDateInputValue, dateInputValueToISOString } from '../utils/date'
import { isAmountInvalid, resolveAmountInput } from '../utils/amountFormula'

function ExpenseForm({ onExpenseCreated }) {
  const { categories, isLoading: isLoadingCategories } = useCategories()
  const { subcategories, isLoading: isLoadingSubcategories } = useSubcategories()
  const { people, isLoading: isLoadingPeople } = usePeople()
  const { paymentMethods, isLoading: isLoadingPaymentMethods } = usePaymentMethods()
  const { buckets, isLoading: isLoadingBuckets } = useBuckets()
  const { banks, isLoading: isLoadingBanks } = useBanks()
  const { investmentBoxes, isLoading: isLoadingInvestmentBoxes } = useInvestmentBoxes()

  const [type, setType] = useState('expense')
  const [isInstallment, setIsInstallment] = useState(false)
  const [description, setDescription] = useState('')
  const [comment, setComment] = useState('')
  const [amount, setAmount] = useState('')
  const [totalAmount, setTotalAmount] = useState('')
  const [installmentCount, setInstallmentCount] = useState('2')
  const [date, setDate] = useState(todayDateInputValue)
  const [categoryId, setCategoryId] = useState('')
  const [subcategoryId, setSubcategoryId] = useState('')
  const [personId, setPersonId] = useState('')
  const [paymentMethodId, setPaymentMethodId] = useState('')
  const [bucketId, setBucketId] = useState('')
  const [bankId, setBankId] = useState('')
  const [investmentBoxId, setInvestmentBoxId] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [attemptedSubmit, setAttemptedSubmit] = useState(false)

  const noSubcategories = !isLoadingSubcategories && subcategories.length === 0

  const isLoadingOptions =
    isLoadingCategories ||
    isLoadingPeople ||
    isLoadingPaymentMethods ||
    isLoadingBuckets ||
    isLoadingBanks ||
    isLoadingInvestmentBoxes ||
    isLoadingSubcategories

  const defaultPaymentMethodId = useMemo(() => {
    const defaultMethod = paymentMethods.find((m) => m.is_default)
    return defaultMethod ? String(defaultMethod.id) : paymentMethods[0] ? String(paymentMethods[0].id) : ''
  }, [paymentMethods])

  const effectivePaymentMethodId = paymentMethodId || defaultPaymentMethodId

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

  const selectedBucket = buckets.find((b) => String(b.id) === effectiveBucketId)
  const isGoalWithdrawal = type === 'expense' && !isInstallment && Boolean(selectedBucket?.is_goal_withdrawal)
  const needsInvestmentBox = type === 'investment' || isGoalWithdrawal

  const handleTypeChange = (nextType) => {
    setType(nextType)
    if (nextType !== 'expense') {
      setIsInstallment(false)
    }
  }

  const resolvedAmount = resolveAmountInput(amount)
  const resolvedTotalAmount = resolveAmountInput(totalAmount)

  const isAmountMissing = isInstallment
    ? isAmountInvalid(resolvedTotalAmount, { allowZero: false }) || !installmentCount
    : isAmountInvalid(resolvedAmount)

  const isFormInvalid =
    !description.trim() ||
    !date ||
    !subcategoryId ||
    !effectivePersonId ||
    !effectivePaymentMethodId ||
    !effectiveBucketId ||
    !effectiveBankId ||
    (needsInvestmentBox && !effectiveInvestmentBoxId) ||
    isAmountMissing

  const handleSubmit = (e) => {
    e.preventDefault()
    setAttemptedSubmit(true)

    if (noSubcategories || isFormInvalid) return

    setAmount(resolvedAmount)
    setTotalAmount(resolvedTotalAmount)
    setError(null)
    setIsSubmitting(true)

    const shared = {
      description,
      category_id: Number(categoryId),
      subcategory_id: Number(subcategoryId),
      person_id: Number(effectivePersonId),
      payment_method_id: Number(effectivePaymentMethodId),
      bucket_id: Number(effectiveBucketId),
      bank_id: Number(effectiveBankId),
    }

    const request = isInstallment
      ? createInstallmentPurchase({
          ...shared,
          total_amount: parseFloat(resolvedTotalAmount),
          installment_count: Number(installmentCount),
          purchase_date: dateInputValueToISOString(date),
        })
      : createExpense({
          ...shared,
          amount: parseFloat(resolvedAmount),
          type,
          date: dateInputValueToISOString(date),
          ...(needsInvestmentBox ? { investment_box_id: Number(effectiveInvestmentBoxId) } : {}),
          ...(comment.trim() ? { comment: comment.trim() } : {}),
        })

    request
      .then((created) => {
        onExpenseCreated(created)
        setDescription('')
        setComment('')
        setAmount('')
        setTotalAmount('')
        setInstallmentCount('2')
        setDate(todayDateInputValue())
        setCategoryId('')
        setSubcategoryId('')
        setInvestmentBoxId('')
        setIsInstallment(false)
        setAttemptedSubmit(false)
      })
      .catch((err) => {
        console.error('Erro ao criar transação:', err)
        setError('Não foi possível salvar a transação. Tente novamente.')
      })
      .finally(() => setIsSubmitting(false))
  }

  return (
    <form className="expense-form" onSubmit={handleSubmit}>
      {isLoadingOptions && <LoadingBar variant="dialog" />}

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

      <div className={`field${attemptedSubmit && !description.trim() ? ' field--error' : ''}`}>
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
            <div className={`field${attemptedSubmit && isAmountMissing ? ' field--error' : ''}`}>
              <label htmlFor="total-amount">Valor total</label>
              <input
                id="total-amount"
                type="text"
                inputMode="decimal"
                placeholder="0,00 (ou =10+5,50)"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                onBlur={(e) => setTotalAmount(resolveAmountInput(e.target.value))}
                required
              />
            </div>
            <div className={`field${attemptedSubmit && !installmentCount ? ' field--error' : ''}`}>
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

          <div className="field">
            <label htmlFor="comment">Comentário (opcional)</label>
            <input
              id="comment"
              type="text"
              placeholder="Ex: Cancelado, reembolsado pelo Guilherme"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>

          <div className="field-row">
            <div className={`field${attemptedSubmit && !date ? ' field--error' : ''}`}>
              <label htmlFor="purchase-date">Data da compra</label>
              <DatePicker id="purchase-date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>

            <div className={`field${attemptedSubmit && !subcategoryId ? ' field--error' : ''}`}>
              <label htmlFor="subcategory">Subcategoria</label>
              <SubcategorySelect
                id="subcategory"
                categories={categories}
                subcategories={subcategories}
                value={subcategoryId}
                onChange={(nextSubcategoryId, nextCategoryId) => {
                  setSubcategoryId(nextSubcategoryId)
                  setCategoryId(nextCategoryId)
                }}
                disabled={noSubcategories}
              />
            </div>
          </div>
        </>
      ) : (
        <>
          <div className={`field${attemptedSubmit && isAmountMissing ? ' field--error' : ''}`}>
            <label htmlFor="amount">Valor</label>
            <input
              id="amount"
              type="text"
              inputMode="decimal"
              placeholder="0,00 (ou =10+5,50)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              onBlur={(e) => setAmount(resolveAmountInput(e.target.value))}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="comment">Comentário (opcional)</label>
            <input
              id="comment"
              type="text"
              placeholder="Ex: Cancelado, reembolsado pelo Guilherme"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>

          <div className="field-row">
            <div className={`field${attemptedSubmit && !date ? ' field--error' : ''}`}>
              <label htmlFor="date">Data</label>
              <DatePicker id="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>

            <div className={`field${attemptedSubmit && !subcategoryId ? ' field--error' : ''}`}>
              <label htmlFor="subcategory">Subcategoria</label>
              <SubcategorySelect
                id="subcategory"
                categories={categories}
                subcategories={subcategories}
                value={subcategoryId}
                onChange={(nextSubcategoryId, nextCategoryId) => {
                  setSubcategoryId(nextSubcategoryId)
                  setCategoryId(nextCategoryId)
                }}
                disabled={noSubcategories}
              />
            </div>
          </div>
        </>
      )}

      <div className="field-row">
        <div className={`field${attemptedSubmit && !effectivePersonId ? ' field--error' : ''}`}>
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

        <div className={`field${attemptedSubmit && !effectivePaymentMethodId ? ' field--error' : ''}`}>
          <label htmlFor="payment-method">Método de pagamento</label>
          <select
            id="payment-method"
            value={effectivePaymentMethodId}
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
        <div className={`field${attemptedSubmit && !effectiveBucketId ? ' field--error' : ''}`}>
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

        <div className={`field${attemptedSubmit && !effectiveBankId ? ' field--error' : ''}`}>
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

      {needsInvestmentBox && (
        <div className={`field${attemptedSubmit && !effectiveInvestmentBoxId ? ' field--error' : ''}`}>
          <label htmlFor="investment-box">
            {isGoalWithdrawal ? 'Retirar da caixinha de investimento' : 'Caixinha de investimento'}
          </label>
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

      {noSubcategories && (
        <p className="form-error">Cadastre uma categoria e uma subcategoria antes de adicionar despesas.</p>
      )}

      {attemptedSubmit && isFormInvalid && (
        <p className="form-error">Preencha os campos destacados antes de continuar.</p>
      )}

      {error && <p className="form-error">{error}</p>}

      <button type="submit" className="btn btn-primary" disabled={isSubmitting || noSubcategories}>
        {isSubmitting ? 'Salvando…' : 'Adicionar transação'}
      </button>
    </form>
  )
}

export default ExpenseForm
