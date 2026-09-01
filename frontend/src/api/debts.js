import { fetchJson } from './config'

export function fetchDebts() {
  return fetchJson('/debts')
}

export function createDebt(debt) {
  return fetchJson('/debts', { method: 'POST', body: JSON.stringify(debt) })
}

export function updateDebt(id, debt, scope) {
  return fetchJson(`/debts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(scope ? { ...debt, scope } : debt),
  })
}

export function deleteDebt(id, scope) {
  const query = scope ? `?scope=${scope}` : ''
  return fetchJson(`/debts/${id}${query}`, { method: 'DELETE' })
}

export function addDebtPayment(id, payment) {
  return fetchJson(`/debts/${id}/payments`, { method: 'POST', body: JSON.stringify(payment) })
}

export function deleteDebtPayment(id, paymentId) {
  return fetchJson(`/debts/${id}/payments/${paymentId}`, { method: 'DELETE' })
}
