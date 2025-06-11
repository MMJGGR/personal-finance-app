import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import App from '../App'
import { FinanceProvider } from '../FinanceContext'

beforeAll(() => {
  global.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} }
})

test('sidebar navigation updates active section', async () => {
  render(
    <FinanceProvider>
      <App />
    </FinanceProvider>
  )

  await screen.findByText(/Client Profile/i)

  fireEvent.click(screen.getByRole('tab', { name: /Income/i }))
  const incomeHeading = await screen.findByText(/Income Sources/i)
  expect(incomeHeading).toBeInTheDocument()

  fireEvent.click(screen.getByRole('tab', { name: /Preferences/i }))
  const settingsHeading = await screen.findByText(/Global Settings/i)
  expect(settingsHeading).toBeInTheDocument()
})
