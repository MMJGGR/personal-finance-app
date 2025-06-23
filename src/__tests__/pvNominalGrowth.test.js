import React, { useEffect } from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
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
  localStorage.setItem('settings', JSON.stringify({ discountRate: 10, inflationRate: 5, startYear: current }))
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
    { name: 'Rent', amount: 500, frequency: 'Annually', growth: 4, priority: 1 }
  ]))

  render(
    <FinanceProvider>
      <ExpensePV years={5} />
    </FinanceProvider>
  )

  const expected = calculatePV(500, 1, 4, 8, 5)
  expect(Number(screen.getByTestId('pv').textContent)).toBeCloseTo(expected)
})

test('expense PV defaults to inflation rate when growth missing', () => {
  const current = new Date().getFullYear()
  localStorage.setItem('settings', JSON.stringify({ discountRate: 5, inflationRate: 2, startYear: current }))
  localStorage.setItem('expensesList', JSON.stringify([
    { name: 'Rent', amount: 1000, frequency: 1, startYear: current }
  ]))

  render(
    <FinanceProvider>
      <ExpensePV years={2} />
    </FinanceProvider>
  )

  const expected = calculatePV(1000, 1, 2, 5, 2)
  expect(Number(screen.getByTestId('pv').textContent)).toBeCloseTo(expected)
})

function ExpensePVUpdate({ years, newGrowth }) {
  const { expensesPV, setYears, setExpensesList } = useFinance()
  useEffect(() => { setYears(years) }, [years, setYears])
  const handle = () => setExpensesList(prev => prev.map((e, i) => i === 0 ? { ...e, growth: newGrowth } : e))
  return (
    <div>
      <div data-testid="pv">{expensesPV}</div>
      <button onClick={handle} data-testid="update">update</button>
    </div>
  )
}

test('expense PV updates when growth changes', async () => {
  const current = new Date().getFullYear()
  localStorage.setItem('profile', JSON.stringify({ nationality: 'Kenyan', age: 30, lifeExpectancy: 32 }))
  localStorage.setItem('settings', JSON.stringify({ discountRate: 5, inflationRate: 0, startYear: current, projectionYears: 2 }))
  localStorage.setItem('expensesList', JSON.stringify([
    { name: 'Rent', amount: 100, frequency: 1, growth: 0, startYear: current }
  ]))

  render(
    <FinanceProvider>
      <ExpensePVUpdate years={2} newGrowth={10} />
    </FinanceProvider>
  )

  const pvNode = screen.getByTestId('pv')
  const before = Number(pvNode.textContent)
  fireEvent.click(screen.getByTestId('update'))
  await waitFor(() => Number(pvNode.textContent) !== before)
  const expected = calculatePV(100, 1, 10, 5, 2)
  expect(Number(pvNode.textContent)).toBeCloseTo(expected)
})
