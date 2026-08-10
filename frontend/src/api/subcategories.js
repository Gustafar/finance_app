import { fetchJson } from './config'

export function fetchSubcategories() {
  return fetchJson('/subcategories')
}

export function createSubcategory(subcategory) {
  return fetchJson('/subcategories', { method: 'POST', body: JSON.stringify(subcategory) })
}

export function updateSubcategory(id, subcategory) {
  return fetchJson(`/subcategories/${id}`, { method: 'PUT', body: JSON.stringify(subcategory) })
}

export function deleteSubcategory(id) {
  return fetchJson(`/subcategories/${id}`, { method: 'DELETE' })
}
