import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import LifetimeStackedChart from '../components/ExpensesGoals/LifetimeStackedChart'

beforeAll(() => {
  global.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} }
  Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, value: 800 })
})

test('renders within ResponsiveContainer and series hide/show when toggled', () => {
  const data = [
    { year: 2024, income: 100, expenses: 50, goals: 20, debtService: 10 }
  ]
  const { container } = render(
    <div style={{ width: 800 }}>
      <LifetimeStackedChart data={data} locale="en-US" currency="USD" />
    </div>
  )
  expect(container.querySelector('.recharts-responsive-container')).toBeInTheDocument()
  const chkExp = screen.getByLabelText('expenses')
  expect(chkExp).toBeChecked()
  fireEvent.click(chkExp)
  expect(chkExp).not.toBeChecked()
  fireEvent.click(chkExp)
  expect(chkExp).toBeChecked()

  const chkDebt = screen.getByLabelText('debt')
  expect(chkDebt).toBeChecked()
  fireEvent.click(chkDebt)
  expect(chkDebt).not.toBeChecked()
  fireEvent.click(chkDebt)
  expect(chkDebt).toBeChecked()
})
