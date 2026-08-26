import { useState, useMemo } from 'react'
import { updateExpense, anticipateInstallments } from '../api/expenses'
import SubcategorySelect from './SubcategorySelect'
import DatePicker from './DatePicker'
import AnticipateInstallmentsDialog from './AnticipateInstallmentsDialog'
import { useCategories } from '../hooks/useCategories'
import { useSubcategories } from '../hooks/useSubcategories'
import { usePeople } from '../hooks/usePeople'
import { usePaymentMethods } from '../hooks/usePaymentMethods'
import { useBuckets } from '../hooks/useBuckets'
import { useBanks } from '../hooks/useBanks'
import { useInvestmentBoxes } from '../hooks/useInvestmentBoxes'
import { TRANSACTION_TYPES } from '../utils/transactionTypes'
import { dateInputValueToISOString, isoStringToDateInputValue } from '../utils/date'
import { isAmountFormula, isAmountInvalid, maskAmountInput, resolveAmountInput, formatAmountForDisplay } from '../utils/amountFormula'
import ConfirmDialog from './ConfirmDialog'
import InstallmentScopeDialog from './InstallmentScopeDialog'
import LoadingBar from './LoadingBar'

function ExpenseEditForm({ expense, onExpenseUpdated }) {
  const { categories, isLoading: isLoadingCategories } = useCategories()
  const { subcategories, isLoading: isLoadingSubcategories } = useSubcategories()
  const { people, isLoading: isLoadingPeople } = usePeople()
  const { paymentMethods, isLoading: isLoadingPaymentMethods } = usePaymentMethods()
  const { buckets, isLoading: isLoadingBuckets } = useBuckets()
  const { banks, isLoading: isLoadingBanks } = useBanks()
  const { investmentBoxes, isLoading: isLoadingInvestmentBoxes } = useInvestmentBoxes()

  const [type, setType] = useState(expense.type)
  const [description, setDescription] = useState(expense.description)
  const [comment, setComment] = useState(expense.comment || '')
  const [amount, setAmount] = useState(formatAmountForDisplay(expense.amount))
  const [amountFormula, setAmountFormula] = useState(expense.amount_formula || null)
  const [date, setDate] = useState(isoStringToDateInputValue(expense.date))
  const [categoryId, setCategoryId] = useState(String(expense.category_id))
  const [subcategoryId, setSubcategoryId] = useState(expense.subcategory_id ? String(expense.subcategory_id) : '')
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
  const [showAnticipate, setShowAnticipate] = useState(false)
  const [isAnticipating, setIsAnticipating] = useState(false)

  const noSubcategories = !isLoadingSubcategories && subcategories.length === 0
  const isInstallment = Boolean(expense.installment_purchase_id)
  const isFutureInstallment = isInstallment && new Date(expense.date) > new Date()

  const isLoadingOptions =
    isLoadingCategories ||
    isLoadingPeople ||
    isLoadingPaymentMethods ||
    isLoadingBuckets ||
    isLoadingBanks ||
    isLoadingInvestmentBoxes ||
    isLoadingSubcategories

  const defaultInvestmentBoxId = useMemo(() => {
    const defaultBox = investmentBoxes.find((b) => b.is_default)
    return defaultBox ? String(defaultBox.id) : investmentBoxes[0] ? String(investmentBoxes[0].id) : ''
  }, [investmentBoxes])

  const effectiveInvestmentBoxId = investmentBoxId || defaultInvestmentBoxId

  const selectedBucket = buckets.find((b) => String(b.id) === bucketId)
  const isGoalWithdrawal = type === 'expense' && Boolean(selectedBucket?.is_goal_withdrawal)
  const needsInvestmentBox = type === 'investment' || isGoalWithdrawal

  const resolvedAmount = resolveAmountInput(amount)
  const isAmountMissing = isAmountInvalid(resolvedAmount)

  const isFormInvalid =
    !description.trim() ||
    isAmountMissing ||
    !date ||
    !subcategoryId ||
    !personId ||
    !paymentMethodId ||
    !bucketId ||
    !bankId ||
    (needsInvestmentBox && !effectiveInvestmentBoxId)

  const handleSubmit = (e) => {
    e.preventDefault()
    setAttemptedSubmit(true)

    if (noSubcategories || isFormInvalid) return

    if (isAmountFormula(amount)) setAmountFormula(amount)
    setAmount(resolvedAmount)
    setShowConfirm(true)
  }

  const performUpdate = (scope) => {
    setShowConfirm(false)
    setError(null)
    setIsSubmitting(true)

    const updatedExpense = {
      description,
      amount: parseFloat(resolvedAmount),
      type,
      category_id: Number(categoryId),
      subcategory_id: Number(subcategoryId),
      person_id: Number(personId),
      payment_method_id: Number(paymentMethodId),
      bucket_id: Number(bucketId),
      bank_id: Number(bankId),
      date: dateInputValueToISOString(date),
      amount_formula: amountFormula,
      ...(needsInvestmentBox ? { investment_box_id: Number(effectiveInvestmentBoxId) } : {}),
      ...(comment.trim() ? { comment: comment.trim() } : {}),
    }

    updateExpense(expense.id, updatedExpense, isInstallment ? scope : undefined)
      .then((data) => onExpenseUpdated(data, isInstallment ? scope : undefined))
      .catch((err) => {
        console.error('Erro ao atualizar despesa:', err)
        setError('Não foi possível salvar as alterações. Tente novamente.')
      })
      .finally(() => setIsSubmitting(false))
  }

  const performAnticipate = (newDate, count) => {
    setIsAnticipating(true)

    anticipateInstallments(expense.id, dateInputValueToISOString(newDate), count)
      .then((data) => {
        setShowAnticipate(false)
        onExpenseUpdated(data, 'future')
      })
      .catch((err) => {
        console.error('Erro ao antecipar parcelas:', err)
        setError('Não foi possível antecipar as parcelas. Tente novamente.')
      })
      .finally(() => setIsAnticipating(false))
  }

  return (
    <>
      <form className="expense-form" onSubmit={handleSubmit}>
        {isLoadingOptions && <LoadingBar variant="dialog" />}

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

        <div className={`field${attemptedSubmit && isAmountMissing ? ' field--error' : ''}`}>
          <label htmlFor="edit-amount">Valor</label>
          <input
            id="edit-amount"
            type="text"
            inputMode="decimal"
            placeholder="0,00 (ou =10+5,50)"
            value={amount}
            onChange={(e) => setAmount(maskAmountInput(e.target.value))}
            onFocus={() => {
              if (amountFormula) setAmount(amountFormula)
            }}
            onBlur={(e) => {
              const text = e.target.value
              if (isAmountFormula(text)) {
                setAmountFormula(text)
                setAmount(resolveAmountInput(text))
              } else {
                setAmountFormula(null)
                setAmount(resolveAmountInput(text))
              }
            }}
            required
          />
        </div>

        <div className="field">
          <label htmlFor="edit-comment">Comentário (opcional)</label>
          <input
            id="edit-comment"
            type="text"
            placeholder="Ex: Cancelado, reembolsado pelo Guilherme"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </div>

        <div className="field-row">
          <div className={`field${attemptedSubmit && !date ? ' field--error' : ''}`}>
            <label htmlFor="edit-date">Data</label>
            <DatePicker id="edit-date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>

          <div className={`field${attemptedSubmit && !subcategoryId ? ' field--error' : ''}`}>
            <label htmlFor="edit-subcategory">Subcategoria</label>
            <SubcategorySelect
              id="edit-subcategory"
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

        {needsInvestmentBox && (
          <div className={`field${attemptedSubmit && !effectiveInvestmentBoxId ? ' field--error' : ''}`}>
            <label htmlFor="edit-investment-box">
              {isGoalWithdrawal ? 'Retirar da caixinha de investimento' : 'Caixinha de investimento'}
            </label>
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

        {isFutureInstallment && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setShowAnticipate(true)}
            disabled={isSubmitting}
          >
            Antecipar parcelas
          </button>
        )}

        <button type="submit" className="btn btn-primary" disabled={isSubmitting || noSubcategories}>
          {isSubmitting ? 'Salvando…' : 'Salvar alterações'}
        </button>
      </form>

      {isInstallment ? (
        <InstallmentScopeDialog
          isOpen={showConfirm}
          title="Salvar alterações"
          message="Esta transação faz parte de uma compra parcelada. O que deseja alterar?"
          confirmLabel="Salvar"
          isConfirming={isSubmitting}
          onConfirm={performUpdate}
          onCancel={() => setShowConfirm(false)}
        />
      ) : (
        <ConfirmDialog
          isOpen={showConfirm}
          title="Salvar alterações"
          message="Confirma as alterações nesta transação?"
          confirmLabel="Salvar"
          onConfirm={performUpdate}
          onCancel={() => setShowConfirm(false)}
        />
      )}

      {isFutureInstallment && (
        <AnticipateInstallmentsDialog
          isOpen={showAnticipate}
          maxDate={isoStringToDateInputValue(expense.date)}
          remainingCount={expense.installment_count - expense.installment_number + 1}
          isConfirming={isAnticipating}
          onConfirm={performAnticipate}
          onCancel={() => setShowAnticipate(false)}
        />
      )}
    </>
  )
}

export default ExpenseEditForm
