const API_URL = 'http://localhost:9080'

async function parseJsonOrThrow(response) {
  if (!response.ok) {
    throw new Error(`Requisição falhou com status ${response.status}`)
  }
  return response.json()
}

export function fetchBanks() {
  return fetch(`${API_URL}/banks`).then(parseJsonOrThrow)
}

export function createBank(bank) {
  return fetch(`${API_URL}/banks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bank),
  }).then(parseJsonOrThrow)
}

export function updateBank(id, bank) {
  return fetch(`${API_URL}/banks/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bank),
  }).then(parseJsonOrThrow)
}

export function deleteBank(id) {
  return fetch(`${API_URL}/banks/${id}`, { method: 'DELETE' }).then((response) => {
    if (!response.ok) {
      throw new Error(`Requisição falhou com status ${response.status}`)
    }
  })
}
