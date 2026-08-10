import { useEffect, useState } from 'react'
import { fetchSubcategories } from '../api/subcategories'

export function sortByName(subcategories) {
  return [...subcategories].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
}

export function useSubcategories() {
  const [subcategories, setSubcategories] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchSubcategories()
      .then((data) => setSubcategories(sortByName(data)))
      .catch((err) => {
        console.error('Erro ao buscar subcategorias:', err)
        setError('Não foi possível carregar as subcategorias.')
      })
      .finally(() => setIsLoading(false))
  }, [])

  return { subcategories, setSubcategories, isLoading, error }
}
