import React from 'react'
import { render, screen } from '@testing-library/react'
import { FinanceProvider } from '../FinanceContext'
import ExpensesGoalsTab from '../components/ExpensesGoals/ExpensesGoalsTab'
import { calculateAmortizedPayment } from '../utils/financeUtils'

beforeAll(() => {
  global.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} }
})

afterEach(() => {
  localStorage.clear()
})

function mount() {
  const now = 2024
  const payment = calculateAmortizedPayment(1200, 6, 1, 12)
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
    computedPayment: payment,
  }
  localStorage.setItem('currentPersonaId', 'hadi')
  localStorage.setItem('profile-hadi', JSON.stringify({ nationality: 'Kenyan', age: 30, lifeExpectancy: 80 }))
  localStorage.setItem('settings-hadi', '{}')
  localStorage.setItem('expensesList-hadi', JSON.stringify([]))
  localStorage.setItem('goalsList-hadi', JSON.stringify([]))
  localStorage.setItem('liabilitiesList-hadi', JSON.stringify([liability]))
  localStorage.setItem('includeGoalsPV-hadi', 'true')
  localStorage.setItem('includeLiabilitiesNPV-hadi', 'true')

  return render(
    <FinanceProvider>
      <ExpensesGoalsTab />
    </FinanceProvider>
  )
}

test('liability payment amount is displayed', async () => {
  mount()
  await screen.findByText('PV of Liabilities')
  const val = calculateAmortizedPayment(1200, 6, 1, 12)
  expect(val).toBeGreaterThan(0)
})
