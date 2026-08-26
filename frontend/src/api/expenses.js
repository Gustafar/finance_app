import { fetchJson } from './config'

export function fetchExpenses() {
  return fetchJson('/expenses')
}

export function createExpense(expense) {
  return fetchJson('/expenses', { method: 'POST', body: JSON.stringify(expense) })
}

export function createInstallmentPurchase(purchase) {
  return fetchJson('/expenses/installments', { method: 'POST', body: JSON.stringify(purchase) })
}

export function createExpensesBulk(rows) {
  return fetchJson('/expenses/bulk', { method: 'POST', body: JSON.stringify({ rows }) })
}

export function updateExpense(id, expense, scope) {
  return fetchJson(`/expenses/${id}`, {
    method: 'PUT',
    body: JSON.stringify(scope ? { ...expense, scope } : expense),
  })
}

export function deleteExpense(id, scope) {
  const query = scope ? `?scope=${scope}` : ''
  return fetchJson(`/expenses/${id}${query}`, { method: 'DELETE' })
}

export function anticipateInstallments(id, date, count) {
  return fetchJson(`/expenses/${id}/anticipate`, { method: 'POST', body: JSON.stringify({ date, count }) })
}
