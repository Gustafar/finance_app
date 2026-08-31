import { normalizeAmountSeparators, formatAmountForDisplay } from './amountFormula'

export const emptyRecurringForm = {
  description: '',
  amount: '',
  type: 'expense',
  day_of_month: '1',
  category_id: '',
  subcategory_id: '',
  person_id: '',
  payment_method_id: '',
  bucket_id: '',
  bank_id: '',
  include_in_expenses: true,
  comment: '',
}

// Builds a fresh form pre-selecting each entity's default option (falling back to the first one),
// so "new item" forms don't come up with every dropdown blank. Mirrors createDefaults in
// RecurringExpensesPage.
export function recurringFormWithDefaults({ categories = [], people = [], paymentMethods = [], buckets = [], banks = [] } = {}) {
  const pick = (list) => {
    const chosen = list.find((item) => item.is_default) ?? list[0]
    return chosen ? String(chosen.id) : ''
  }
  return {
    ...emptyRecurringForm,
    category_id: pick(categories),
    person_id: pick(people),
    payment_method_id: pick(paymentMethods),
    bucket_id: pick(buckets),
    bank_id: pick(banks),
  }
}

export function recurringFormToPayload(form) {
  return {
    description: form.description.trim(),
    amount: parseFloat(normalizeAmountSeparators(form.amount)),
    type: form.type,
    day_of_month: Number(form.day_of_month),
    category_id: Number(form.category_id),
    subcategory_id: Number(form.subcategory_id),
    person_id: Number(form.person_id),
    payment_method_id: Number(form.payment_method_id),
    bucket_id: Number(form.bucket_id),
    bank_id: Number(form.bank_id),
    include_in_expenses: Boolean(form.include_in_expenses),
    ...(form.comment.trim() ? { comment: form.comment.trim() } : {}),
  }
}

export function isRecurringFormComplete(form) {
  return Boolean(
    form.description.trim() &&
      form.amount &&
      form.day_of_month &&
      form.category_id &&
      form.subcategory_id &&
      form.person_id &&
      form.payment_method_id &&
      form.bucket_id &&
      form.bank_id
  )
}

export function recurringFormFromRow(recurring) {
  return {
    description: recurring.description,
    amount: formatAmountForDisplay(recurring.amount),
    type: recurring.type,
    day_of_month: String(recurring.day_of_month),
    category_id: String(recurring.category_id),
    subcategory_id: recurring.subcategory_id ? String(recurring.subcategory_id) : '',
    person_id: String(recurring.person_id),
    payment_method_id: String(recurring.payment_method_id),
    bucket_id: String(recurring.bucket_id),
    bank_id: String(recurring.bank_id),
    include_in_expenses: recurring.include_in_expenses,
    comment: recurring.comment ?? '',
  }
}
