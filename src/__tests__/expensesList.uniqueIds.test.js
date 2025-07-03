import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { FinanceProvider, useFinance } from '../FinanceContext'
import storage from '../utils/storage'

beforeAll(() => {
  global.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} }
})

afterEach(() => {
  localStorage.clear()
})

function ExpEditor() {
  const { expensesList, setExpensesList } = useFinance()
  const editFirst = () =>
    setExpensesList(prev => prev.map((e, i) => (i === 0 ? { ...e, amount: 150 } : e)))
  return (
    <div>
      <div data-testid="id0">{expensesList[0]?.id}</div>
      <div data-testid="id1">{expensesList[1]?.id}</div>
      <div data-testid="amount0">{expensesList[0]?.amount}</div>
      <div data-testid="amount1">{expensesList[1]?.amount}</div>
      <button data-testid="edit" onClick={editFirst}>edit</button>
    </div>
  )
}

test('duplicate expense IDs are deduped and edits apply to correct row', async () => {
  const now = new Date().getFullYear()
  localStorage.setItem('currentPersonaId', 'hadi')
  storage.setPersona('hadi')
  localStorage.setItem('profile-hadi', JSON.stringify({ nationality: 'Kenyan', age: 30, lifeExpectancy: 80 }))
  localStorage.setItem('expensesList-hadi', JSON.stringify([
    { id: 'dup', name: 'Rent', amount: 100, paymentsPerYear: 12, startYear: now },
    { id: 'dup', name: 'Gym', amount: 50, paymentsPerYear: 12, startYear: now },
  ]))
  localStorage.setItem('goalsList-hadi', '[]')
  localStorage.setItem('liabilitiesList-hadi', '[]')

  render(
    <FinanceProvider>
      <ExpEditor />
    </FinanceProvider>
  )

  const id0 = await screen.findByTestId('id0')
  const id1 = screen.getByTestId('id1')
  const amt0 = screen.getByTestId('amount0')
  const amt1 = screen.getByTestId('amount1')

  expect(id0.textContent).not.toBe(id1.textContent)
  expect(amt0.textContent).toBe('100')
  expect(amt1.textContent).toBe('50')

  fireEvent.click(screen.getByTestId('edit'))

  await waitFor(() => expect(screen.getByTestId('amount0').textContent).toBe('150'))
  expect(screen.getByTestId('amount1').textContent).toBe('50')
})
