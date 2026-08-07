const API_URL = 'http://localhost:9080'

async function parseJsonOrThrow(response) {
  if (!response.ok) {
    throw new Error(`Requisição falhou com status ${response.status}`)
  }
  return response.json()
}

export function fetchRecurringExpenses() {
  return fetch(`${API_URL}/recurring-expenses`).then(parseJsonOrThrow)
}

export function createRecurringExpense(recurring) {
  return fetch(`${API_URL}/recurring-expenses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(recurring),
  }).then(parseJsonOrThrow)
}

export function updateRecurringExpense(id, recurring) {
  return fetch(`${API_URL}/recurring-expenses/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(recurring),
  }).then(parseJsonOrThrow)
}

export function deleteRecurringExpense(id) {
  return fetch(`${API_URL}/recurring-expenses/${id}`, { method: 'DELETE' }).then((response) => {
    if (!response.ok) {
      throw new Error(`Requisição falhou com status ${response.status}`)
    }
  })
}

export function generateDueRecurringExpenses() {
  return fetch(`${API_URL}/recurring-expenses/generate-due`, { method: 'POST' }).then(parseJsonOrThrow)
}
