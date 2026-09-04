import { TRANSACTION_TYPES } from '../utils/transactionTypes'
import { clampDayOfMonth } from '../utils/date'
import { resolveAmountInput } from '../utils/amountFormula'
import AmountInput from './AmountInput'
import EmojiTextInput from './EmojiTextInput'
import SubcategorySelect from './SubcategorySelect'
import SearchableSelect from './SearchableSelect'

const toOptions = (list) => list.map((item) => ({ value: String(item.id), label: item.name }))

function RecurringFields({ idPrefix, form, onChange, categories, subcategories, people, paymentMethods, buckets, banks, attemptedSubmit }) {
  const errCls = (invalid) => `field${attemptedSubmit && invalid ? ' field--error' : ''}`

  return (
    <>
      <div className="field">
        <label>Tipo</label>
        <div className="type-toggle" role="radiogroup" aria-label="Tipo de transação">
          {TRANSACTION_TYPES.map((option) => (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={form.type === option.value}
              className={`type-toggle-option${form.type === option.value ? ' type-toggle-option--selected' : ''}`}
              onClick={() => onChange({ ...form, type: option.value })}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className={errCls(!form.description.trim())}>
        <label htmlFor={`${idPrefix}-description`}>Descrição</label>
        <EmojiTextInput
          id={`${idPrefix}-description`}
          type="text"
          placeholder="Ex: Aluguel"
          value={form.description}
          onChange={(value) => onChange({ ...form, description: value })}
        />
      </div>

      <div className="field-row">
        <div className={errCls(!form.amount)}>
          <label htmlFor={`${idPrefix}-amount`}>Valor</label>
          <AmountInput
            id={`${idPrefix}-amount`}
            value={form.amount}
            onChange={(amount) => onChange({ ...form, amount })}
            onBlur={(text) => onChange({ ...form, amount: resolveAmountInput(text) })}
          />
        </div>
        <div className={errCls(!form.day_of_month)}>
          <label htmlFor={`${idPrefix}-day`}>Dia do mês</label>
          <input
            id={`${idPrefix}-day`}
            type="number"
            min="1"
            max="31"
            value={form.day_of_month}
            onChange={(e) => onChange({ ...form, day_of_month: clampDayOfMonth(e.target.value) })}
          />
        </div>
      </div>

      <div className="field">
        <label htmlFor={`${idPrefix}-comment`}>Comentário (opcional)</label>
        <EmojiTextInput
          id={`${idPrefix}-comment`}
          type="text"
          placeholder="Ex: Cancelado, reembolsado pelo Guilherme"
          value={form.comment}
          onChange={(value) => onChange({ ...form, comment: value })}
        />
      </div>

      <div className="field-row">
        <div className={errCls(!form.subcategory_id)}>
          <label htmlFor={`${idPrefix}-subcategory`}>Subcategoria</label>
          <SubcategorySelect
            id={`${idPrefix}-subcategory`}
            categories={categories}
            subcategories={subcategories}
            value={form.subcategory_id}
            onChange={(subcategoryId, categoryId) => onChange({ ...form, subcategory_id: subcategoryId, category_id: categoryId })}
          />
        </div>
        <div className={errCls(!form.person_id)}>
          <label htmlFor={`${idPrefix}-person`}>Responsável</label>
          <SearchableSelect
            id={`${idPrefix}-person`}
            value={form.person_id}
            onChange={(person_id) => onChange({ ...form, person_id })}
            options={toOptions(people)}
            ariaLabel="Responsável"
          />
        </div>
      </div>

      <div className="field-row">
        <div className={errCls(!form.payment_method_id)}>
          <label htmlFor={`${idPrefix}-payment-method`}>Método de pagamento</label>
          <SearchableSelect
            id={`${idPrefix}-payment-method`}
            value={form.payment_method_id}
            onChange={(payment_method_id) => onChange({ ...form, payment_method_id })}
            options={toOptions(paymentMethods)}
            ariaLabel="Método de pagamento"
          />
        </div>
        <div className={errCls(!form.bucket_id)}>
          <label htmlFor={`${idPrefix}-bucket`}>Envelope</label>
          <SearchableSelect
            id={`${idPrefix}-bucket`}
            value={form.bucket_id}
            onChange={(bucket_id) => onChange({ ...form, bucket_id })}
            options={toOptions(buckets)}
            ariaLabel="Envelope"
          />
        </div>
      </div>

      <div className="field-row field-row--end">
        <div className={errCls(!form.bank_id)}>
          <label htmlFor={`${idPrefix}-bank`}>Banco</label>
          <SearchableSelect
            id={`${idPrefix}-bank`}
            value={form.bank_id}
            onChange={(bank_id) => onChange({ ...form, bank_id })}
            options={toOptions(banks)}
            ariaLabel="Banco"
          />
        </div>

        <label className="checkbox-field checkbox-field--compact" htmlFor={`${idPrefix}-include-in-expenses`}>
          <input
            id={`${idPrefix}-include-in-expenses`}
            type="checkbox"
            checked={form.include_in_expenses}
            onChange={(e) => onChange({ ...form, include_in_expenses: e.target.checked })}
          />
          Lançar automaticamente
        </label>
      </div>
    </>
  )
}

export default RecurringFields
