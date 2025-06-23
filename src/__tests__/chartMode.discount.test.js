import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { FinanceProvider } from '../FinanceContext'
import IncomeTab from '../components/Income/IncomeTab'
import ExpensesGoalsTab from '../components/ExpensesGoals/ExpensesGoalsTab'

jest.mock('recharts', () => {
  const actual = jest.requireActual('recharts')
  return {
    ...actual,
    ResponsiveContainer: ({ children }) => <div>{children}</div>,
    BarChart: props => {
      global.__chartData = props.data
      return <div />
    },
    Bar: () => null,
    XAxis: () => null,
    YAxis: () => null,
    CartesianGrid: () => null,
    Tooltip: () => null,
    Legend: () => null,
  }
})

jest.mock('../components/Income/IncomeTimelineChart', () => ({
  __esModule: true,
  default: jest.fn(() => null)
}))

const IncomeTimelineChart = require('../components/Income/IncomeTimelineChart').default

global.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} }

afterEach(() => {
  jest.clearAllMocks()
  localStorage.clear()
})

function setupIncome() {
  const now = 2024
  localStorage.setItem('settings', JSON.stringify({ discountRate: 10, startYear: now, projectionYears: 2 }))
  localStorage.setItem('incomeSources', JSON.stringify([
    { name: 'Job', amount: 1000, frequency: 1, growth: 0, taxRate: 0, startYear: now, active: true }
  ]))
  return render(
    <FinanceProvider>
      <IncomeTab />
    </FinanceProvider>
  )
}

function setupExpenses() {
  const now = 2024
  localStorage.setItem('settings', JSON.stringify({ discountRate: 10, startYear: now }))
  localStorage.setItem('expensesList', JSON.stringify([
    { id:'e1', name:'Rent', amount: 120, frequency:'Annually', paymentsPerYear:1, growth:0, category:'Fixed', priority:1, include:true, startYear: now, endYear: now + 1 }
  ]))
  localStorage.setItem('goalsList', JSON.stringify([]))
  localStorage.setItem('liabilitiesList', JSON.stringify([]))
  localStorage.setItem('includeGoalsPV', 'false')
  localStorage.setItem('includeLiabilitiesNPV', 'false')
  return render(
    <FinanceProvider>
      <ExpensesGoalsTab />
    </FinanceProvider>
  )
}

test('income chart discounted mode lowers future values', () => {
  setupIncome()
  const nominalCall = IncomeTimelineChart.mock.calls.at(-1)[0]
  const grossNominal = nominalCall.data[1].gross
  fireEvent.click(screen.getByText('Discounted'))
  const pvCall = IncomeTimelineChart.mock.calls.at(-1)[0]
  const grossPV = pvCall.data[1].gross
  expect(grossPV).toBeLessThan(grossNominal)
})

test('expenses chart discounted mode lowers future totals', () => {
  setupExpenses()
  const nominal = global.__chartData
  const valNominal = nominal[1]['Fixed']
  fireEvent.click(screen.getByText('Discounted'))
  const discounted = global.__chartData
  const valPV = discounted[1]['Fixed']
  expect(valPV).toBeLessThan(valNominal)
})
