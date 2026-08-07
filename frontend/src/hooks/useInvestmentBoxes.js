import { useEffect, useState } from 'react'
import { fetchInvestmentBoxes } from '../api/investmentBoxes'

export function sortByName(boxes) {
  return [...boxes].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
}

export function useInvestmentBoxes() {
  const [investmentBoxes, setInvestmentBoxes] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchInvestmentBoxes()
      .then((data) => setInvestmentBoxes(sortByName(data)))
      .catch((err) => {
        console.error('Erro ao buscar caixinhas de investimento:', err)
        setError('Não foi possível carregar as caixinhas de investimento.')
      })
      .finally(() => setIsLoading(false))
  }, [])

  return { investmentBoxes, setInvestmentBoxes, isLoading, error }
}
