import { useEffect, useState } from 'react'
import { fetchBanks } from '../api/banks'

export function sortByName(banks) {
  return [...banks].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
}

export function useBanks() {
  const [banks, setBanks] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchBanks()
      .then((data) => setBanks(sortByName(data)))
      .catch((err) => {
        console.error('Erro ao buscar bancos:', err)
        setError('Não foi possível carregar os bancos.')
      })
      .finally(() => setIsLoading(false))
  }, [])

  return { banks, setBanks, isLoading, error }
}
