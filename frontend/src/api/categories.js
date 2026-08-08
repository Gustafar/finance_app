import { fetchJson } from './config'

export function fetchCategories() {
  return fetchJson('/categories')
}

export function createCategory(category) {
  return fetchJson('/categories', { method: 'POST', body: JSON.stringify(category) })
}

export function updateCategory(id, category) {
  return fetchJson(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(category) })
}

export function setDefaultCategory(id) {
  return fetchJson(`/categories/${id}/default`, { method: 'PUT' })
}

export function deleteCategory(id) {
  return fetchJson(`/categories/${id}`, { method: 'DELETE' })
}
