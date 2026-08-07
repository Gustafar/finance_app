import { useEffect, useState } from 'react'
import { fetchRecurringExpenses } from '../api/recurringExpenses'

export function sortByDay(recurrences) {
  return [...recurrences].sort((a, b) => {
    if (a.day_of_month !== b.day_of_month) return a.day_of_month - b.day_of_month
    return a.description.localeCompare(b.description, 'pt-BR')
  })
}

export function useRecurringExpenses() {
  const [recurrences, setRecurrences] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchRecurringExpenses()
      .then((data) => setRecurrences(sortByDay(data)))
      .catch((err) => {
        console.error('Erro ao buscar gastos fixos:', err)
        setError('Não foi possível carregar os gastos fixos.')
      })
      .finally(() => setIsLoading(false))
  }, [])

  return { recurrences, setRecurrences, isLoading, error }
}
