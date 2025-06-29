import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { FinanceProvider } from '../FinanceContext'
import IncomeTab from '../components/Income/IncomeTab'

beforeAll(() => { global.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} } })

afterEach(() => { localStorage.clear() })

test('income source interactions and advisory', () => {
  localStorage.setItem('currentPersonaId', 'hadi')
  localStorage.setItem('profile-hadi', JSON.stringify({ nationality: 'Kenyan', age: 30, lifeExpectancy: 85 }))
  localStorage.setItem('settings-hadi', '{}')
  localStorage.setItem('incomeSources-hadi', JSON.stringify([
    { name: 'Job', amount: 1000, frequency: 12, growth: 0, taxRate: 0, type: 'Salary', active: true },
    { name: 'Bonus', amount: 500, frequency: 12, growth: 0, taxRate: 0, type: 'Bonus', active: true }
  ]))
  localStorage.setItem('monthlyExpense-hadi', '2000')

  render(
    <FinanceProvider>
      <IncomeTab />
    </FinanceProvider>
  )

  expect(screen.getByText(/Total PV \(Gross\)/)).toBeInTheDocument()
  expect(screen.getByText(/Stability/)).toBeInTheDocument()

  expect(screen.getByText(/Total PV \(Gross\)/)).toBeInTheDocument()
})
