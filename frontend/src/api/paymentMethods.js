import { fetchJson } from './config'

export function fetchPaymentMethods() {
  return fetchJson('/payment-methods')
}

export function createPaymentMethod(paymentMethod) {
  return fetchJson('/payment-methods', { method: 'POST', body: JSON.stringify(paymentMethod) })
}

export function updatePaymentMethod(id, paymentMethod) {
  return fetchJson(`/payment-methods/${id}`, { method: 'PUT', body: JSON.stringify(paymentMethod) })
}

export function setDefaultPaymentMethod(id) {
  return fetchJson(`/payment-methods/${id}/default`, { method: 'PUT' })
}

export function deletePaymentMethod(id) {
  return fetchJson(`/payment-methods/${id}`, { method: 'DELETE' })
}
