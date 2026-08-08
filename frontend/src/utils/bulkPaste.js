import { TRANSACTION_TYPES } from './transactionTypes'

export function parsePastedAmount(text) {
  const trimmed = text.trim().replace(/[^\d,.-]/g, '')
  if (!trimmed) return ''
  if (trimmed.includes(',') && trimmed.includes('.')) {
    return trimmed.replace(/\./g, '').replace(',', '.')
  }
  if (trimmed.includes(',')) {
    return trimmed.replace(',', '.')
  }
  return trimmed
}

export function resolveIdByName(list, text) {
  const needle = text.trim().toLowerCase()
  if (!needle) return ''
  const match = list.find((item) => item.name.toLowerCase() === needle)
  return match ? String(match.id) : ''
}

export function resolveType(text) {
  const needle = text.trim().toLowerCase()
  const match = TRANSACTION_TYPES.find((t) => t.label.toLowerCase() === needle || t.value.toLowerCase() === needle)
  return match ? match.value : ''
}