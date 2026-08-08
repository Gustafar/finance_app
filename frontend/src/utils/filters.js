export const EMPTY_FILTERS = {
  categoryId: [],
  personId: [],
  paymentMethodId: [],
  bucketId: [],
  bankId: [],
  dateFrom: '',
  dateTo: '',
}

export function hasActiveFilters(filters) {
  return Boolean(
    filters.categoryId.length ||
      filters.personId.length ||
      filters.paymentMethodId.length ||
      filters.bucketId.length ||
      filters.bankId.length ||
      filters.dateFrom ||
      filters.dateTo,
  )
}

export function matchesFilters(expense, filters) {
  return (
    (filters.categoryId.length === 0 || filters.categoryId.includes(String(expense.category_id))) &&
    (filters.personId.length === 0 || filters.personId.includes(String(expense.person_id))) &&
    (filters.paymentMethodId.length === 0 || filters.paymentMethodId.includes(String(expense.payment_method_id))) &&
    (filters.bucketId.length === 0 || filters.bucketId.includes(String(expense.bucket_id))) &&
    (filters.bankId.length === 0 || filters.bankId.includes(String(expense.bank_id)))
  )
}
