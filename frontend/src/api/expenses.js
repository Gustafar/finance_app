const API_URL = 'http://localhost:9080'

async function parseJsonOrThrow(response) {
  if (!response.ok) {
    throw new Error(`Requisição falhou com status ${response.status}`)
  }
  return response.json()
}

export function fetchExpenses() {
  return fetch(`${API_URL}/expenses`).then(parseJsonOrThrow)
}

export function createExpense(expense) {
  return fetch(`${API_URL}/expenses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(expense),
  }).then(parseJsonOrThrow)
}

export function createInstallmentPurchase(purchase) {
  return fetch(`${API_URL}/expenses/installments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(purchase),
  }).then(parseJsonOrThrow)
}

export function updateExpense(id, expense) {
  return fetch(`${API_URL}/expenses/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(expense),
  }).then(parseJsonOrThrow)
}

export function deleteExpense(id) {
  return fetch(`${API_URL}/expenses/${id}`, { method: 'DELETE' }).then((response) => {
    if (!response.ok) {
      throw new Error(`Requisição falhou com status ${response.status}`)
    }
  })
}
