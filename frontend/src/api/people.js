const API_URL = 'http://localhost:9080'

async function parseJsonOrThrow(response) {
  if (!response.ok) {
    throw new Error(`Requisição falhou com status ${response.status}`)
  }
  return response.json()
}

export function fetchPeople() {
  return fetch(`${API_URL}/people`).then(parseJsonOrThrow)
}

export function createPerson(person) {
  return fetch(`${API_URL}/people`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(person),
  }).then(parseJsonOrThrow)
}

export function updatePerson(id, person) {
  return fetch(`${API_URL}/people/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(person),
  }).then(parseJsonOrThrow)
}

export function deletePerson(id) {
  return fetch(`${API_URL}/people/${id}`, { method: 'DELETE' }).then((response) => {
    if (!response.ok) {
      throw new Error(`Requisição falhou com status ${response.status}`)
    }
  })
}
