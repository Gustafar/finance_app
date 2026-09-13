import { fetchJson, API_URL, getToken } from './config'

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

// exportExpensesStatement downloads the XLSX statement for the given period and saves it via the
// browser's normal file-download flow. Uses raw fetch (not fetchJson) since the response is a
// binary file, not JSON.
export async function exportExpensesStatement(dateFrom, dateTo) {
  const token = getToken()
  const headers = token ? { Authorization: `Bearer ${token}` } : {}

  const response = await fetch(
    `${API_URL}/expenses/export?date_from=${dateFrom}&date_to=${dateTo}`,
    { headers }
  )

  if (!response.ok) {
    let message = `Requisição falhou com status ${response.status}`
    try {
      message = (await response.json())?.error || message
    } catch {
      // response body wasn't JSON — keep the default message
    }
    throw new Error(message)
  }

  const blob = await response.blob()
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `extrato_${dateFrom}_a_${dateTo}.xlsx`
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}
