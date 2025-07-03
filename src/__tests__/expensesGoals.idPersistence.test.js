import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { FinanceProvider, useFinance } from '../FinanceContext'
import ExpensesGoalsTab from '../components/ExpensesGoals/ExpensesGoalsTab'
import storage from '../utils/storage'

beforeAll(() => {
  global.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} }
})

afterEach(() => {
  localStorage.clear()
})

function setup() {
  const now = 2024
  localStorage.setItem('currentPersonaId', 'hadi')
  storage.setPersona('hadi')
  localStorage.setItem('profile-hadi', JSON.stringify({ nationality: 'Kenyan', age: 30, lifeExpectancy: 80 }))
  localStorage.setItem('expensesList-hadi', JSON.stringify([
    { id: 'e1', name: 'Rent', amount: 100, frequency: 'Monthly', paymentsPerYear: 12, startYear: now },
    { id: 'e2', name: 'Gym', amount: 50, frequency: 'Monthly', paymentsPerYear: 12, startYear: now }
  ]))
  localStorage.setItem('goalsList-hadi', JSON.stringify([
    { id: 'g1', name: 'Trip', amount: 2000, targetYear: now, startYear: now, endYear: now },
    { id: 'g2', name: 'Car', amount: 5000, targetYear: now, startYear: now, endYear: now }
  ]))
  localStorage.setItem('liabilitiesList-hadi', JSON.stringify([]))

  function Wrapper() {
    const { expensesList, goalsList } = useFinance()
    return (
      <>
        <div data-testid="exp0-id">{expensesList[0]?.id}</div>
        <div data-testid="exp1-id">{expensesList[1]?.id}</div>
        <div data-testid="goal0-id">{goalsList[0]?.id}</div>
        <div data-testid="goal1-id">{goalsList[1]?.id}</div>
        <ExpensesGoalsTab />
      </>
    )
  }

  return render(
    <FinanceProvider>
      <Wrapper />
    </FinanceProvider>
  )
}

test('editing items preserves unique ids', async () => {
  setup()
  await screen.findByText('PV of Expenses')

  const initialExp0 = screen.getByTestId('exp0-id').textContent
  const initialExp1 = screen.getByTestId('exp1-id').textContent
  const initialGoal0 = screen.getByTestId('goal0-id').textContent
  const initialGoal1 = screen.getByTestId('goal1-id').textContent

  const expenseAmt = screen.getAllByTitle('Expense amount')[0]
  fireEvent.change(expenseAmt, { target: { value: '150' } })

  const goalAmt = screen.getAllByTitle('Goal amount')[0]
  fireEvent.change(goalAmt, { target: { value: '3000' } })

  await waitFor(() => expect(screen.getAllByTitle('Expense amount')[0].value).toBe('150'))
  await waitFor(() => expect(screen.getAllByTitle('Goal amount')[0].value).toBe('3000'))

  const finalExp0 = screen.getByTestId('exp0-id').textContent
  const finalExp1 = screen.getByTestId('exp1-id').textContent
  const finalGoal0 = screen.getByTestId('goal0-id').textContent
  const finalGoal1 = screen.getByTestId('goal1-id').textContent

  expect(finalExp0).toBe(initialExp0)
  expect(finalExp1).toBe(initialExp1)
  expect(finalExp0).not.toBe(finalExp1)

  expect(finalGoal0).toBe(initialGoal0)
  expect(finalGoal1).toBe(initialGoal1)
  expect(finalGoal0).not.toBe(finalGoal1)
})
