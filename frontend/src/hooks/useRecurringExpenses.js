import { useEffect, useState } from 'react'
import { fetchRecurringExpenses } from '../api/recurringExpenses'

export function sortByDay(recurrences) {
  return [...recurrences].sort((a, b) => {
    if (a.day_of_month !== b.day_of_month) return a.day_of_month - b.day_of_month
    return a.description.localeCompare(b.description, 'pt-BR')
  })
}

export function useRecurringExpenses(year, month) {
  const [recurrences, setRecurrences] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting loading/error state when the viewed month changes, before the fetch below settles
    setIsLoading(true)
    setError(null)

    fetchRecurringExpenses(year, month)
      .then((data) => setRecurrences(sortByDay(data)))
      .catch((err) => {
        console.error('Erro ao buscar gastos fixos:', err)
        setError('Não foi possível carregar os gastos fixos.')
      })
      .finally(() => setIsLoading(false))
  }, [year, month])

  return { recurrences, setRecurrences, isLoading, error }
}
