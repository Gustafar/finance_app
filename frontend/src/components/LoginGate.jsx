import { useEffect, useState } from 'react'
import { API_URL, getToken, setToken, setUnauthorizedHandler } from '../api/config'

function LoginGate({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(getToken()))
  const [isCheckingStatus, setIsCheckingStatus] = useState(() => !getToken())
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    setUnauthorizedHandler(() => setIsAuthenticated(false))
  }, [])

  // If the backend has no APP_PASSWORD configured, auth is off — skip the login screen entirely.
  useEffect(() => {
    if (isAuthenticated) return

    fetch(`${API_URL}/auth/status`)
      .then((response) => response.json())
      .then((data) => {
        if (!data.auth_required) setIsAuthenticated(true)
      })
      .catch(() => {})
      .finally(() => setIsCheckingStatus(false))
  }, [isAuthenticated])

  const handleSubmit = (e) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
      .then((response) => {
        if (!response.ok) throw new Error('invalid password')
        return response.json()
      })
      .then((data) => {
        setToken(data.token)
        setIsAuthenticated(true)
        setPassword('')
      })
      .catch(() => setError('Senha incorreta. Tente novamente.'))
      .finally(() => setIsSubmitting(false))
  }

  if (isAuthenticated) return children
  if (isCheckingStatus) return null

  return (
    <div className="login-gate">
      <form className="login-form" onSubmit={handleSubmit}>
        <div className="brand login-brand">
          <span className="brand-mark">R$</span>
          <span>Minhas Finanças</span>
        </div>

        <div className="field">
          <label htmlFor="login-password">Senha</label>
          <input
            id="login-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            required
          />
        </div>

        {error && <p className="form-error">{error}</p>}

        <button type="submit" className="btn btn-primary" disabled={isSubmitting || !password}>
          {isSubmitting ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </div>
  )
}

export default LoginGate
