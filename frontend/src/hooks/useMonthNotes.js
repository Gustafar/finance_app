import { useEffect, useState } from 'react'
import { fetchMonthNotes } from '../api/monthNotes'

export function useMonthNotes(year, month) {
  const [notes, setNotes] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting loading/error state when the viewed month changes, before the fetch below settles
    setIsLoading(true)
    setError(null)

    fetchMonthNotes(year, month)
      .then(setNotes)
      .catch((err) => {
        console.error('Erro ao buscar notas:', err)
        setError('Não foi possível carregar as notas.')
      })
      .finally(() => setIsLoading(false))
  }, [year, month])

  return { notes, setNotes, isLoading, error }
}
