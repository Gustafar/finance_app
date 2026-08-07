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

export function updateExpense(id, expense) {
  return fetchJson(`/expenses/${id}`, { method: 'PUT', body: JSON.stringify(expense) })
}

export function deleteExpense(id) {
  return fetchJson(`/expenses/${id}`, { method: 'DELETE' })
}
