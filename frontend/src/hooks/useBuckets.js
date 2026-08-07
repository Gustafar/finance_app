import { useEffect, useState } from 'react'
import { fetchBuckets } from '../api/buckets'

export function sortByName(buckets) {
  return [...buckets].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
}

export function useBuckets() {
  const [buckets, setBuckets] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchBuckets()
      .then((data) => setBuckets(sortByName(data)))
      .catch((err) => {
        console.error('Erro ao buscar buckets:', err)
        setError('Não foi possível carregar os Envelopes.')
      })
      .finally(() => setIsLoading(false))
  }, [])

  return { buckets, setBuckets, isLoading, error }
}
