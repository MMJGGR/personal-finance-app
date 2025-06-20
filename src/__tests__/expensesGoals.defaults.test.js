import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { FinanceProvider, useFinance } from '../FinanceContext'
import ExpensesGoalsTab from '../components/ExpensesGoals/ExpensesGoalsTab'

beforeAll(() => {
  global.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} }
})

afterEach(() => {
  localStorage.clear()
})

function mount() {
  localStorage.setItem('profile', JSON.stringify({ nationality: 'Kenyan', age: 30, lifeExpectancy: 85 }))
  function Lengths() {
    const { expensesList, goalsList } = useFinance()
    return (
      <>
        <div data-testid="exp-count">{expensesList.length}</div>
        <div data-testid="goal-count">{goalsList.length}</div>
        <ExpensesGoalsTab />
      </>
    )
  }
  return render(
    <FinanceProvider>
      <Lengths />
    </FinanceProvider>
  )
}

test('defaults populate when lists empty', async () => {
  mount()
  expect(localStorage.getItem('expensesList')).not.toBeNull()
  await screen.findByText(/PV of Expenses/)
  await waitFor(() => localStorage.getItem('expensesList') !== '[]', { timeout: 2000 })
  await waitFor(() => localStorage.getItem('goalsList') !== '[]', { timeout: 2000 })
  await waitFor(() => localStorage.getItem('investmentContributions') !== '[]', { timeout: 2000 })
  await waitFor(() => localStorage.getItem('pensionStreams') !== '[]', { timeout: 2000 })
})

test('defaults not loaded when stored data present', async () => {
  localStorage.setItem('expensesList', JSON.stringify([
    { name: 'Gym', amount: 50, paymentsPerYear: 12, startYear: 2024, priority: 1 }
  ]))
  localStorage.setItem('investmentContributions', JSON.stringify([
    { name: 'Seed', amount: 100, frequency: 12, startYear: 2024 }
  ]))
  localStorage.setItem('pensionStreams', JSON.stringify([
    { name: 'Legacy Pension', amount: 5000, frequency: 12, startYear: 2060 }
  ]))
  mount()
  await screen.findByText(/PV of Expenses/)
  await waitFor(() => localStorage.getItem('expensesList')?.includes('Gym'), { timeout: 2000 })
  await waitFor(() => localStorage.getItem('investmentContributions')?.includes('Seed'), { timeout: 2000 })
  await waitFor(() => localStorage.getItem('pensionStreams')?.includes('Legacy'), { timeout: 2000 })
})
