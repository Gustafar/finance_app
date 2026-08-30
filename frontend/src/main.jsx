import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import LoginGate from './components/LoginGate.jsx'
import { VisibilityProvider } from './context/VisibilityContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <LoginGate>
        <VisibilityProvider>
          <App />
        </VisibilityProvider>
      </LoginGate>
    </BrowserRouter>
  </StrictMode>,
)
