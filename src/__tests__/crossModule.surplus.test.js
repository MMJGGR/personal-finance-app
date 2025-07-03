import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { FinanceProvider, useFinance } from '../FinanceContext'

beforeAll(() => { global.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} } })

afterEach(() => { localStorage.clear() })

function SurplusControls() {
  const { incomeSources, setIncomeSources, expensesList, setExpensesList, monthlySurplusNominal } = useFinance()
  const boostIncome = () => setIncomeSources(prev => prev.map((s,i)=> i===0 ? { ...s, amount: 1500 } : s))
  const increaseExpense = () => setExpensesList(prev => prev.map((e,i)=> i===0 ? { ...e, amount: 1000 } : e))
  return (
    <div>
      <div data-testid="surplus">{monthlySurplusNominal}</div>
      <button data-testid="income" onClick={boostIncome}>income</button>
      <button data-testid="expense" onClick={increaseExpense}>expense</button>
    </div>
  )
}

test('monthly surplus reflects income and expense changes', async () => {
  const now = new Date().getFullYear()
  localStorage.setItem('currentPersonaId', 'hadi')
  localStorage.setItem('profile-hadi', JSON.stringify({ age:30, lifeExpectancy:85, nationality:'Kenyan' }))
  localStorage.setItem('settings-hadi', JSON.stringify({ startYear: now }))
  localStorage.setItem('incomeSources-hadi', JSON.stringify([
    { name:'Job', type:'Salary', amount:1000, frequency:12, growth:0, taxRate:0 }
  ]))
  localStorage.setItem('expensesList-hadi', JSON.stringify([
    { name:'Rent', amount:800, paymentsPerYear:12, startYear: now }
  ]))

  render(
    <FinanceProvider>
      <SurplusControls />
    </FinanceProvider>
  )

  const node = await screen.findByTestId('surplus')
  expect(node.textContent).toBe('200')

  fireEvent.click(screen.getByTestId('income'))
  await waitFor(() => expect(node.textContent).toBe('700'))

  fireEvent.click(screen.getByTestId('expense'))
  await waitFor(() => expect(node.textContent).toBe('500'))
})
