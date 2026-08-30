import { useEffect, useState } from 'react'
import { VisibilityContext, VISIBILITY_STORAGE_KEY } from './visibilityContext'

function readStoredHidden() {
  return localStorage.getItem(VISIBILITY_STORAGE_KEY) === '1'
}

export function VisibilityProvider({ children }) {
  const [hidden, setHidden] = useState(readStoredHidden)

  useEffect(() => {
    localStorage.setItem(VISIBILITY_STORAGE_KEY, hidden ? '1' : '0')
  }, [hidden])

  const toggleHidden = () => setHidden((current) => !current)

  return (
    <VisibilityContext.Provider value={{ hidden, toggleHidden }}>
      {children}
    </VisibilityContext.Provider>
  )
}
