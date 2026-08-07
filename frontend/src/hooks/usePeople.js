import { useEffect, useState } from 'react'
import { fetchPeople } from '../api/people'

export function sortByName(people) {
  return [...people].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
}

export function usePeople() {
  const [people, setPeople] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchPeople()
      .then((data) => setPeople(sortByName(data)))
      .catch((err) => {
        console.error('Erro ao buscar responsáveis:', err)
        setError('Não foi possível carregar os responsáveis.')
      })
      .finally(() => setIsLoading(false))
  }, [])

  return { people, setPeople, isLoading, error }
}
