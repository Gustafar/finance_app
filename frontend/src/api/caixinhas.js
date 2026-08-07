const API_URL = 'http://localhost:9080'

async function parseJsonOrThrow(response) {
  if (!response.ok) {
    throw new Error(`Requisição falhou com status ${response.status}`)
  }
  return response.json()
}

export function fetchCaixinhas() {
  return fetch(`${API_URL}/caixinhas`).then(parseJsonOrThrow)
}

export function createCaixinha(caixinha) {
  return fetch(`${API_URL}/caixinhas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(caixinha),
  }).then(parseJsonOrThrow)
}

export function updateCaixinha(id, caixinha) {
  return fetch(`${API_URL}/caixinhas/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(caixinha),
  }).then(parseJsonOrThrow)
}

export function deleteCaixinha(id) {
  return fetch(`${API_URL}/caixinhas/${id}`, { method: 'DELETE' }).then((response) => {
    if (!response.ok) {
      throw new Error(`Requisição falhou com status ${response.status}`)
    }
  })
}
