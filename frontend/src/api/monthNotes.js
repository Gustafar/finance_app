import { fetchJson } from './config'

// The backend uses 1-indexed months; callers here use the frontend's 0-indexed convention.
export function fetchMonthNotes(year, month) {
  return fetchJson(`/month-notes?year=${year}&month=${month + 1}`)
}

export function createMonthNote(year, month, note) {
  return fetchJson('/month-notes', {
    method: 'POST',
    body: JSON.stringify({ ...note, year, month: month + 1 }),
  })
}

export function updateMonthNote(id, note) {
  return fetchJson(`/month-notes/${id}`, { method: 'PUT', body: JSON.stringify(note) })
}

export function deleteMonthNote(id) {
  return fetchJson(`/month-notes/${id}`, { method: 'DELETE' })
}
