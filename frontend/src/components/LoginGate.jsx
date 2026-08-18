import { useEffect, useState } from 'react'
import { API_URL, getToken, setToken, setUnauthorizedHandler } from '../api/config'
import LoadingBar from './LoadingBar'

function LoginGate({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(getToken()))
  const [isCheckingStatus, setIsCheckingStatus] = useState(() => !getToken())
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [showPassword, setShowPassword] = useState(false)

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
  if (isCheckingStatus) return <LoadingBar />

  return (
    <div className="login-gate">
      <form className="login-form" onSubmit={handleSubmit}>
        <div className="brand login-brand">
          <img src="/favicon.svg" alt="" className="brand-mark" />
          <span>Minhas Finanças</span>
        </div>

        <div className="field">
          <label htmlFor="login-password">Senha</label>
          <div className="password-input-wrapper">
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              required
            />
            <button
              type="button"
              className="icon-btn password-toggle"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              tabIndex={-1}
            >
              {showPassword ? (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M1.5 8S4 3 8 3s6.5 5 6.5 5-2.5 5-6.5 5-6.5-5-6.5-5Z"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.4" />
                  <path d="M2 14L14 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M1.5 8S4 3 8 3s6.5 5 6.5 5-2.5 5-6.5 5-6.5-5-6.5-5Z"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.4" />
                </svg>
              )}
            </button>
          </div>
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
