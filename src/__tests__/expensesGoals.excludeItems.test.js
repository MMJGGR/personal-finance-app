import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { FinanceProvider } from '../FinanceContext'
import ExpensesGoalsTab from '../components/ExpensesGoals/ExpensesGoalsTab'
import { calculateAmortizedPayment } from '../utils/financeUtils'

beforeAll(() => {
  global.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} }
})

afterEach(() => {
  localStorage.clear()
})

function setup() {
  const now = 2024
  localStorage.setItem('profile', JSON.stringify({ nationality: 'Kenyan', age: 30, lifeExpectancy: 80 }))
  const expense = {
    id: 'e1',
    name: 'Rent',
    amount: 100,
    frequency: 'Monthly',
    paymentsPerYear: 12,
    growth: 0,
    category: 'Fixed',
    priority: 1,
    include: true,
    startYear: now,
    endYear: now,
  }
  const liability = {
    id: 'l1',
    name: 'Car Loan',
    principal: 1200,
    interestRate: 6,
    termYears: 1,
    paymentsPerYear: 12,
    extraPayment: 0,
    include: true,
    startYear: now,
    endYear: now,
    computedPayment: calculateAmortizedPayment(1200, 6, 1, 12)
  }
  localStorage.setItem('expensesList', JSON.stringify([expense]))
  localStorage.setItem('goalsList', JSON.stringify([]))
  localStorage.setItem('liabilitiesList', JSON.stringify([liability]))
  localStorage.setItem('includeGoalsPV', 'true')
  localStorage.setItem('includeLiabilitiesNPV', 'true')

  return render(
    <FinanceProvider>
      <ExpensesGoalsTab />
    </FinanceProvider>
  )
}

function numeric(text) {
  return Number(text.replace(/[^0-9.-]+/g, ''))
}

test('unchecking an expense removes it from PV totals and chart data', async () => {
  setup()
  const label = await screen.findByText('PV of Expenses')
  const valueNode = label.nextSibling
  await waitFor(() => numeric(valueNode.textContent) > 0)
  const chk = screen.getByLabelText('Include in PV')
  fireEvent.click(chk)
  await waitFor(() => expect(numeric(valueNode.textContent)).toBe(0))
  expect(localStorage.getItem('expensesPV')).toBe('0')
})

test('unchecking a liability removes it from PV totals and chart data', async () => {
  setup()
  const label = await screen.findByText('PV of Liabilities')
  const valueNode = label.nextSibling
  await waitFor(() => numeric(valueNode.textContent) > 0)
  const chk = screen.getByLabelText('Include liability')
  fireEvent.click(chk)
  await waitFor(() => expect(numeric(valueNode.textContent)).toBe(0))
  expect(localStorage.getItem('loansPV')).toBe('0')
})
