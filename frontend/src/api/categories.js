const API_URL = 'http://localhost:9080'

async function parseJsonOrThrow(response) {
  if (!response.ok) {
    throw new Error(`Requisição falhou com status ${response.status}`)
  }
  return response.json()
}

export function fetchCategories() {
  return fetch(`${API_URL}/categories`).then(parseJsonOrThrow)
}

export function createCategory(category) {
  return fetch(`${API_URL}/categories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(category),
  }).then(parseJsonOrThrow)
}

export function updateCategory(id, category) {
  return fetch(`${API_URL}/categories/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(category),
  }).then(parseJsonOrThrow)
}

export function deleteCategory(id) {
  return fetch(`${API_URL}/categories/${id}`, { method: 'DELETE' }).then((response) => {
    if (!response.ok) {
      throw new Error(`Requisição falhou com status ${response.status}`)
    }
  })
}
