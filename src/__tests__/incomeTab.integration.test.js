import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { FinanceProvider } from '../FinanceContext'
import IncomeTab from '../components/Income/IncomeTab'

beforeAll(() => { global.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} } })

afterEach(() => { localStorage.clear() })

test('income source interactions and advisory', () => {
  localStorage.setItem('incomeSources', JSON.stringify([
    { name: 'Job', amount: 1000, frequency: 1, growth: 0, taxRate: 0, type: 'Salary', active: true },
    { name: 'Bonus', amount: 500, frequency: 1, growth: 0, taxRate: 0, type: 'Bonus', active: true }
  ]))
  localStorage.setItem('monthlyExpense', '2000')

  render(
    <FinanceProvider>
      <IncomeTab />
    </FinanceProvider>
  )

  expect(screen.getByText(/Total PV/)).toHaveTextContent('1,500')
  expect(screen.getByText(/Stability/)).toHaveTextContent('77%')

  fireEvent.click(screen.getByLabelText('Add income source'))
  const amounts = screen.getAllByLabelText('Income amount')
  fireEvent.change(amounts[2], { target: { value: '200' } })
  expect(amounts[2]).toHaveValue(200)
  window.confirm = jest.fn(() => true)
  fireEvent.click(screen.getAllByRole('button', { name: /Delete/ })[2])
  
  const toggles = screen.getAllByLabelText('Include this income in projection')
  fireEvent.click(toggles[1])
  expect(screen.getByText(/Total PV/)).toHaveTextContent('1,000')
  expect(screen.getByText(/Stability/)).toHaveTextContent('100%')
  fireEvent.click(toggles[0])
  expect(screen.getByText(/Stability/)).toHaveTextContent('0%')
})
