import { TRANSACTION_TYPES } from '../utils/transactionTypes'
import { clampDayOfMonth } from '../utils/date'
import { normalizeAmountSeparators, maskAmountInput } from '../utils/amountFormula'
import SubcategorySelect from './SubcategorySelect'

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
        <input
          id={`${idPrefix}-description`}
          type="text"
          placeholder="Ex: Aluguel"
          value={form.description}
          onChange={(e) => onChange({ ...form, description: e.target.value })}
        />
      </div>

      <div className="field-row">
        <div className={errCls(!form.amount)}>
          <label htmlFor={`${idPrefix}-amount`}>Valor</label>
          <input
            id={`${idPrefix}-amount`}
            type="text"
            inputMode="decimal"
            placeholder="0,00"
            value={form.amount}
            onChange={(e) => onChange({ ...form, amount: maskAmountInput(e.target.value) })}
            onBlur={(e) => onChange({ ...form, amount: normalizeAmountSeparators(e.target.value) })}
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
        <input
          id={`${idPrefix}-comment`}
          type="text"
          placeholder="Ex: Cancelado, reembolsado pelo Guilherme"
          value={form.comment}
          onChange={(e) => onChange({ ...form, comment: e.target.value })}
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
          <select
            id={`${idPrefix}-person`}
            value={form.person_id}
            onChange={(e) => onChange({ ...form, person_id: e.target.value })}
          >
            <option value="" disabled>Selecione…</option>
            {people.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="field-row">
        <div className={errCls(!form.payment_method_id)}>
          <label htmlFor={`${idPrefix}-payment-method`}>Método de pagamento</label>
          <select
            id={`${idPrefix}-payment-method`}
            value={form.payment_method_id}
            onChange={(e) => onChange({ ...form, payment_method_id: e.target.value })}
          >
            <option value="" disabled>Selecione…</option>
            {paymentMethods.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>
        <div className={errCls(!form.bucket_id)}>
          <label htmlFor={`${idPrefix}-bucket`}>Envelope</label>
          <select
            id={`${idPrefix}-bucket`}
            value={form.bucket_id}
            onChange={(e) => onChange({ ...form, bucket_id: e.target.value })}
          >
            <option value="" disabled>Selecione…</option>
            {buckets.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="field-row field-row--end">
        <div className={errCls(!form.bank_id)}>
          <label htmlFor={`${idPrefix}-bank`}>Banco</label>
          <select
            id={`${idPrefix}-bank`}
            value={form.bank_id}
            onChange={(e) => onChange({ ...form, bank_id: e.target.value })}
          >
            <option value="" disabled>Selecione…</option>
            {banks.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
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
