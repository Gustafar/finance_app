import { fetchJson } from './config'

export function fetchBanks() {
  return fetchJson('/banks')
}

export function createBank(bank) {
  return fetchJson('/banks', { method: 'POST', body: JSON.stringify(bank) })
}

export function updateBank(id, bank) {
  return fetchJson(`/banks/${id}`, { method: 'PUT', body: JSON.stringify(bank) })
}

export function deleteBank(id) {
  return fetchJson(`/banks/${id}`, { method: 'DELETE' })
}
