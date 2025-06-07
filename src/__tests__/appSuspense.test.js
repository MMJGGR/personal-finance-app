import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import App from '../App'
import { FinanceProvider } from '../FinanceContext'

beforeAll(() => {
  global.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} }
})

test('lazy loaded tabs render with Suspense fallback', async () => {
  render(
    <FinanceProvider>
      <App />
    </FinanceProvider>
  )
  // default tab should load
  await screen.findByText(/Income Sources/i)

  fireEvent.click(screen.getByRole('tab', { name: /Settings/i }))

  // Spinner should appear while loading
  expect(screen.getByRole('status')).toBeInTheDocument()

  const settingsHeading = await screen.findByText(/Global Settings/i)
  expect(settingsHeading).toBeInTheDocument()
  // spinner disappears after load
  expect(screen.queryByRole('status')).toBeNull()
})
