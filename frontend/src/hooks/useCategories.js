import { useEffect, useState } from 'react'
import { fetchCategories } from '../api/categories'

export function sortByName(categories) {
  return [...categories].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
}

export function useCategories() {
  const [categories, setCategories] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchCategories()
      .then((data) => setCategories(sortByName(data)))
      .catch((err) => {
        console.error('Erro ao buscar categorias:', err)
        setError('Não foi possível carregar as categorias.')
      })
      .finally(() => setIsLoading(false))
  }, [])

  return { categories, setCategories, isLoading, error }
}
