import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { FinanceProvider, useFinance } from '../FinanceContext'

beforeAll(() => {
  global.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} }
})

afterEach(() => {
  localStorage.clear()
})

function PVTest() {
  const {
    incomePV,
    expensesPV,
    updateSettings,
    settings,
  } = useFinance()

  const handleUpdate = () => {
    updateSettings({ ...settings, discountRate: 10 })
  }

  return (
    <div>
      <div data-testid="income">{incomePV}</div>
      <div data-testid="expenses">{expensesPV}</div>
      <button onClick={handleUpdate} data-testid="update">Update</button>
    </div>
  )
}

test('PV totals update after settings change', async () => {
  localStorage.setItem('currentPersonaId', 'hadi')
  localStorage.setItem(
    'incomeSources-hadi',
    JSON.stringify([
      { name: 'Job', type: 'Salary', amount: 1000, frequency: 1, growth: 0, taxRate: 0 }
    ])
  )
  localStorage.setItem(
    'expensesList-hadi',
    JSON.stringify([
      { name: 'Rent', amount: 500, frequency: 'Annually', growth: 0, priority: 1 }
    ])
  )
  render(
    <FinanceProvider>
      <PVTest />
    </FinanceProvider>
  )

  await waitFor(() =>
    Number(screen.getByTestId('expenses').textContent) > 0
  )

  const incomeBefore = Number(screen.getByTestId('income').textContent)
  const expensesBefore = Number(screen.getByTestId('expenses').textContent)

  fireEvent.click(screen.getByTestId('update'))

  await waitFor(() =>
    Number(screen.getByTestId('income').textContent) !== incomeBefore ||
    Number(screen.getByTestId('expenses').textContent) !== expensesBefore
  )
})
