import { useEffect, useState } from 'react'
import { fetchPaymentMethods } from '../api/paymentMethods'

export function sortByName(paymentMethods) {
  return [...paymentMethods].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
}

export function usePaymentMethods() {
  const [paymentMethods, setPaymentMethods] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchPaymentMethods()
      .then((data) => setPaymentMethods(sortByName(data)))
      .catch((err) => {
        console.error('Erro ao buscar métodos de pagamento:', err)
        setError('Não foi possível carregar os métodos de pagamento.')
      })
      .finally(() => setIsLoading(false))
  }, [])

  return { paymentMethods, setPaymentMethods, isLoading, error }
}
