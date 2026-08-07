import { fetchJson } from './config'

export function fetchRecurringExpenses() {
  return fetchJson('/recurring-expenses')
}

export function createRecurringExpense(recurring) {
  return fetchJson('/recurring-expenses', { method: 'POST', body: JSON.stringify(recurring) })
}

export function updateRecurringExpense(id, recurring) {
  return fetchJson(`/recurring-expenses/${id}`, { method: 'PUT', body: JSON.stringify(recurring) })
}

export function deleteRecurringExpense(id) {
  return fetchJson(`/recurring-expenses/${id}`, { method: 'DELETE' })
}

export function generateDueRecurringExpenses() {
  return fetchJson('/recurring-expenses/generate-due', { method: 'POST' })
}
