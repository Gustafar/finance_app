const API_URL = 'http://localhost:9080'

async function parseJsonOrThrow(response) {
  if (!response.ok) {
    throw new Error(`Requisição falhou com status ${response.status}`)
  }
  return response.json()
}

export function fetchPaymentMethods() {
  return fetch(`${API_URL}/payment-methods`).then(parseJsonOrThrow)
}

export function createPaymentMethod(paymentMethod) {
  return fetch(`${API_URL}/payment-methods`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(paymentMethod),
  }).then(parseJsonOrThrow)
}

export function updatePaymentMethod(id, paymentMethod) {
  return fetch(`${API_URL}/payment-methods/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(paymentMethod),
  }).then(parseJsonOrThrow)
}

export function deletePaymentMethod(id) {
  return fetch(`${API_URL}/payment-methods/${id}`, { method: 'DELETE' }).then((response) => {
    if (!response.ok) {
      throw new Error(`Requisição falhou com status ${response.status}`)
    }
  })
}
