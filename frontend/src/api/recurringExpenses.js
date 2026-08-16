import { fetchJson } from './config'

export function fetchRecurringExpenses(year, month) {
  return fetchJson(`/recurring-expenses?plan_year=${year}&plan_month=${month + 1}`)
}

// The backend returns plan_year/plan_month using its own 1-indexed convention (like day_of_month);
// convert month back to the frontend's 0-indexed convention before handing it back to callers.
export function fetchLatestPlanningMonth(beforeYear, beforeMonth) {
  return fetchJson(`/recurring-expenses/latest-month?before_year=${beforeYear}&before_month=${beforeMonth + 1}`).then(
    ({ year, month }) => ({ year, month: month - 1 })
  )
}

export function replaceMonthPlanning(year, month, rows) {
  return fetchJson('/recurring-expenses/replace-month', {
    method: 'POST',
    body: JSON.stringify({ plan_year: year, plan_month: month + 1, rows }),
  })
}

export function createRecurringExpense(recurring) {
  return fetchJson('/recurring-expenses', { method: 'POST', body: JSON.stringify(recurring) })
}

export function createRecurringExpensesBulk(rows) {
  return fetchJson('/recurring-expenses/bulk', { method: 'POST', body: JSON.stringify({ rows }) })
}

export function updateRecurringExpense(id, recurring) {
  return fetchJson(`/recurring-expenses/${id}`, { method: 'PUT', body: JSON.stringify(recurring) })
}

export function deleteRecurringExpense(id) {
  return fetchJson(`/recurring-expenses/${id}`, { method: 'DELETE' })
}
