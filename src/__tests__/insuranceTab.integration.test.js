import React from 'react'
import { render, screen } from '@testing-library/react'
import { FinanceProvider } from '../FinanceContext'
import InsuranceTab from '../components/Insurance/InsuranceTab'

beforeAll(() => {
  global.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} }
})

afterEach(() => {
  localStorage.clear()
})

test('shows emergency fund months and life cover amount', () => {
  localStorage.setItem('currentPersonaId', 'hadi')
  localStorage.setItem('monthlyExpense-hadi', '2000')
  localStorage.setItem('settings-hadi', '{}')
  localStorage.setItem(
    'expensesList-hadi',
    JSON.stringify([{ name: 'Rent', amount: 2000, paymentsPerYear: 12 }])
  )
  localStorage.setItem(
    'profile-hadi',
    JSON.stringify({ numDependents: 2, annualIncome: 60000, maritalStatus: 'Married' })
  )

  render(
    <FinanceProvider>
      <InsuranceTab />
    </FinanceProvider>
  )

  expect(screen.getByText('Insurance Recommendations')).toBeInTheDocument()
  expect(screen.getByText(/Emergency Fund:/)).toBeInTheDocument()
  expect(screen.getByText(/Life Cover/)).toBeInTheDocument()
})
