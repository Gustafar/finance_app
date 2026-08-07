import { fetchJson } from './config'

export function fetchPeople() {
  return fetchJson('/people')
}

export function createPerson(person) {
  return fetchJson('/people', { method: 'POST', body: JSON.stringify(person) })
}

export function updatePerson(id, person) {
  return fetchJson(`/people/${id}`, { method: 'PUT', body: JSON.stringify(person) })
}

export function deletePerson(id) {
  return fetchJson(`/people/${id}`, { method: 'DELETE' })
}
