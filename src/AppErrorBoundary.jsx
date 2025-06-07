import React from 'react'
import { ErrorBoundary } from 'react-error-boundary'

function Fallback() {
  return (
    <div className="p-4 text-red-600">
      Oops—something went wrong. Please refresh or try a different tab.
    </div>
  )
}

export default function AppErrorBoundary({ children }) {
  return (
    <ErrorBoundary FallbackComponent={Fallback}>
      {children}
    </ErrorBoundary>
  )
}
