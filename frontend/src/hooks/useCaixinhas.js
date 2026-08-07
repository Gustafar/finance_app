import { useEffect, useState } from 'react'
import { fetchCaixinhas } from '../api/caixinhas'

export function sortByName(caixinhas) {
  return [...caixinhas].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
}

export function useCaixinhas() {
  const [caixinhas, setCaixinhas] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchCaixinhas()
      .then((data) => setCaixinhas(sortByName(data)))
      .catch((err) => {
        console.error('Erro ao buscar caixinhas:', err)
        setError('Não foi possível carregar as caixinhas.')
      })
      .finally(() => setIsLoading(false))
  }, [])

  return { caixinhas, setCaixinhas, isLoading, error }
}
