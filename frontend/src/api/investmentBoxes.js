const API_URL = 'http://localhost:9080'

async function parseJsonOrThrow(response) {
  if (!response.ok) {
    throw new Error(`Requisição falhou com status ${response.status}`)
  }
  return response.json()
}

export function fetchInvestmentBoxes() {
  return fetch(`${API_URL}/investment-boxes`).then(parseJsonOrThrow)
}

export function createInvestmentBox(box) {
  return fetch(`${API_URL}/investment-boxes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(box),
  }).then(parseJsonOrThrow)
}

export function updateInvestmentBox(id, box) {
  return fetch(`${API_URL}/investment-boxes/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(box),
  }).then(parseJsonOrThrow)
}

export function deleteInvestmentBox(id) {
  return fetch(`${API_URL}/investment-boxes/${id}`, { method: 'DELETE' }).then((response) => {
    if (!response.ok) {
      throw new Error(`Requisição falhou com status ${response.status}`)
    }
  })
}
