import { useCallback, useEffect, useState } from 'react'
import { fetchDebts } from '../api/debts'

export function useDebts() {
  const [debts, setDebts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const reload = useCallback(() => {
    return fetchDebts()
      .then((data) => {
        setDebts(data)
        setError(null)
      })
      .catch((err) => {
        console.error('Erro ao buscar cobranças:', err)
        setError('Não foi possível carregar as cobranças.')
      })
  }, [])

  useEffect(() => {
    reload().finally(() => setIsLoading(false))
  }, [reload])

  return { debts, setDebts, isLoading, error, reload }
}
