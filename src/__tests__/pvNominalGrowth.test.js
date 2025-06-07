import React, { useEffect } from 'react'
import { render, screen } from '@testing-library/react'
import { FinanceProvider, useFinance } from '../FinanceContext'
import { calculatePV } from '../utils/financeUtils'

global.ResizeObserver = class { observe() {}; unobserve() {}; disconnect() {} }

afterEach(() => {
  localStorage.clear()
})

function IncomePV({ years }) {
  const { incomePV, setYears } = useFinance()
  useEffect(() => { setYears(years) }, [years, setYears])
  return <div data-testid="pv">{incomePV}</div>
}

test('income PV uses nominal growth rate', () => {
  const current = new Date().getFullYear()
  localStorage.setItem('incomeStartYear', String(current))
  localStorage.setItem('settings', JSON.stringify({ discountRate: 10, inflationRate: 5 }))
  localStorage.setItem('incomeSources', JSON.stringify([
    { name: 'Job', type: 'Salary', amount: 1000, frequency: 1, growth: 5, taxRate: 0 }
  ]))

  render(
    <FinanceProvider>
      <IncomePV years={5} />
    </FinanceProvider>
  )

  const expected = calculatePV(1000, 1, 5, 10, 5)
  expect(Number(screen.getByTestId('pv').textContent)).toBeCloseTo(expected)
})

function ExpensePV({ years }) {
  const { expensesPV, setYears } = useFinance()
  useEffect(() => { setYears(years) }, [years, setYears])
  return <div data-testid="pv">{expensesPV}</div>
}

test('expense PV uses nominal growth rate', () => {
  localStorage.setItem('settings', JSON.stringify({ discountRate: 8, inflationRate: 3 }))
  localStorage.setItem('expensesList', JSON.stringify([
    { name: 'Rent', amount: 500, paymentsPerYear: 1, growth: 4, priority: 1 }
  ]))

  render(
    <FinanceProvider>
      <ExpensePV years={5} />
    </FinanceProvider>
  )

  const expected = calculatePV(500, 1, 4, 8, 5)
  expect(Number(screen.getByTestId('pv').textContent)).toBeCloseTo(expected)
})
