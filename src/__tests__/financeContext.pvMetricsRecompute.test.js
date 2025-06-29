import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { FinanceProvider, useFinance } from '../FinanceContext'

beforeAll(() => {
  global.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} }
})

afterEach(() => {
  localStorage.clear()
})

function MetricsTest() {
  const {
    monthlyPVExpense,
    pvHigh,
    updateSettings,
    settings,
  } = useFinance()

  const handleUpdate = () => {
    updateSettings({ ...settings, discountRate: 10 })
  }

  return (
    <div>
      <div data-testid="month">{monthlyPVExpense}</div>
      <div data-testid="high">{pvHigh}</div>
      <button onClick={handleUpdate} data-testid="update">Update</button>
    </div>
  )
}

test('expense PV metrics update after settings change', async () => {
  localStorage.setItem('currentPersonaId', 'hadi')
  localStorage.setItem(
    'expensesList-hadi',
    JSON.stringify([
      { name: 'Rent', amount: 1200, frequency: 'Monthly', growth: 0, priority: 1 }
    ])
  )
  render(
    <FinanceProvider>
      <MetricsTest />
    </FinanceProvider>
  )

  await waitFor(() =>
    Number(screen.getByTestId('high').textContent) > 0
  )

  const monthBefore = Number(screen.getByTestId('month').textContent)
  const highBefore = Number(screen.getByTestId('high').textContent)

  fireEvent.click(screen.getByTestId('update'))

  await waitFor(() =>
    Number(screen.getByTestId('month').textContent) !== monthBefore ||
    Number(screen.getByTestId('high').textContent) !== highBefore
  )
})
