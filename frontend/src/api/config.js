export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:9080'

const TOKEN_KEY = 'financeApp.token'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

let onUnauthorized = null

export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler
}

export async function fetchJson(path, options = {}) {
  const token = getToken()
  const headers = { ...options.headers }
  if (options.body) headers['Content-Type'] = 'application/json'
  if (token) headers['Authorization'] = `Bearer ${token}`

  const response = await fetch(`${API_URL}${path}`, { ...options, headers })

  if (response.status === 401) {
    clearToken()
    onUnauthorized?.()
    throw new Error('Sessão expirada')
  }

  if (!response.ok) {
    throw new Error(`Requisição falhou com status ${response.status}`)
  }

  if (response.status === 204) return undefined
  return response.json()
}
