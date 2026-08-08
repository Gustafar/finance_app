import { fetchJson } from './config'

export function fetchInvestmentBoxes() {
  return fetchJson('/investment-boxes')
}

export function createInvestmentBox(box) {
  return fetchJson('/investment-boxes', { method: 'POST', body: JSON.stringify(box) })
}

export function updateInvestmentBox(id, box) {
  return fetchJson(`/investment-boxes/${id}`, { method: 'PUT', body: JSON.stringify(box) })
}

export function setDefaultInvestmentBox(id) {
  return fetchJson(`/investment-boxes/${id}/default`, { method: 'PUT' })
}

export function deleteInvestmentBox(id) {
  return fetchJson(`/investment-boxes/${id}`, { method: 'DELETE' })
}
