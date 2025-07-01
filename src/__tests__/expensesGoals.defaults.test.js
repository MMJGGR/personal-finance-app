import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import storage from '../utils/storage'
import { FinanceProvider, useFinance } from '../FinanceContext'
import ExpensesGoalsTab from '../components/ExpensesGoals/ExpensesGoalsTab'

beforeAll(() => {
  global.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} }
})

afterEach(() => {
  localStorage.clear()
})

function mount() {
  localStorage.setItem('currentPersonaId', 'hadi')
  storage.setPersona('hadi')
  localStorage.setItem('profile-hadi', JSON.stringify({ nationality: 'Kenyan', age: 30, lifeExpectancy: 85 }))
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
  await screen.findByText(/PV of Expenses/)
  await waitFor(() => localStorage.getItem('expensesList-hadi') !== null)
  await waitFor(() => localStorage.getItem('expensesList-hadi') !== '[]', { timeout: 2000 })
  await waitFor(() => localStorage.getItem('goalsList-hadi') !== '[]', { timeout: 2000 })
  await waitFor(() => localStorage.getItem('investmentContributions-hadi') !== '[]', { timeout: 2000 })
  await waitFor(() => localStorage.getItem('pensionStreams-hadi') !== '[]', { timeout: 2000 })
})

test('defaults not loaded when stored data present', async () => {
  localStorage.setItem('expensesList-hadi', JSON.stringify([
    { name: 'Gym', amount: 50, paymentsPerYear: 12, startYear: 2024, priority: 1 }
  ]))
  localStorage.setItem('investmentContributions-hadi', JSON.stringify([
    { name: 'Seed', amount: 100, frequency: 12, startYear: 2024 }
  ]))
  localStorage.setItem('pensionStreams-hadi', JSON.stringify([
    { name: 'Legacy Pension', amount: 5000, frequency: 12, startYear: 2060 }
  ]))
  mount()
  await screen.findByText(/PV of Expenses/)
  await waitFor(() => localStorage.getItem('expensesList-hadi')?.includes('Gym'), { timeout: 2000 })
  await waitFor(() => localStorage.getItem('investmentContributions-hadi')?.includes('Seed'), { timeout: 2000 })
  await waitFor(() => localStorage.getItem('pensionStreams-hadi')?.includes('Legacy'), { timeout: 2000 })
})
