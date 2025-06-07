import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { FinanceProvider } from './FinanceContext.jsx'
import AppErrorBoundary from './AppErrorBoundary.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <FinanceProvider>
      <AppErrorBoundary>
        <App />
      </AppErrorBoundary>
    </FinanceProvider>
  </StrictMode>,
)
