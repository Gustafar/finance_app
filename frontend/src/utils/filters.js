export const EMPTY_FILTERS = {
  categoryId: '',
  personId: '',
  paymentMethodId: '',
  bucketId: '',
  bankId: '',
  dateFrom: '',
  dateTo: '',
}

export function hasActiveFilters(filters) {
  return Boolean(
    filters.categoryId ||
      filters.personId ||
      filters.paymentMethodId ||
      filters.bucketId ||
      filters.bankId ||
      filters.dateFrom ||
      filters.dateTo,
  )
}

export function matchesFilters(expense, filters) {
  return (
    (!filters.categoryId || expense.category_id === Number(filters.categoryId)) &&
    (!filters.personId || expense.person_id === Number(filters.personId)) &&
    (!filters.paymentMethodId || expense.payment_method_id === Number(filters.paymentMethodId)) &&
    (!filters.bucketId || expense.bucket_id === Number(filters.bucketId)) &&
    (!filters.bankId || expense.bank_id === Number(filters.bankId))
  )
}
