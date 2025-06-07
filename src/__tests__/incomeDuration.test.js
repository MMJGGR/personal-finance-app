import React, { useEffect } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { FinanceProvider, useFinance } from '../FinanceContext'

global.ResizeObserver = class { observe() {}; unobserve() {}; disconnect() {} }

afterEach(() => {
  localStorage.clear()
})

function PVDisplay({ years }) {
  const { incomePV, setYears } = useFinance()
  useEffect(() => { setYears(years) }, [years, setYears])
  return <div data-testid="pv">{incomePV}</div>
}

function SalaryEnd() {
  const { incomeSources, updateSettings, settings } = useFinance()
  useEffect(() => {
    updateSettings({ ...settings, retirementAge: settings.retirementAge + 1 })
  }, [])
  const end = incomeSources[0]?.endYear
  return <div data-testid="end">{end}</div>
}

test('finite income stream stops at endYear', () => {
  const current = new Date().getFullYear()
  localStorage.setItem('settings', JSON.stringify({ inflationRate: 0 }))
  localStorage.setItem('incomeStartYear', String(current))
  localStorage.setItem('incomeSources', JSON.stringify([
    { name: 'Contract', type: 'Employment', amount: 1000, frequency: 1, growth: 0, taxRate: 0, startYear: current, endYear: current + 1 }
  ]))
  render(
    <FinanceProvider>
      <PVDisplay years={5} />
    </FinanceProvider>
  )
  expect(Number(screen.getByTestId('pv').textContent)).toBeCloseTo(2000)
})

test('income without endYear persists through horizon', () => {
  const current = new Date().getFullYear()
  localStorage.setItem('settings', JSON.stringify({ inflationRate: 0 }))
  localStorage.setItem('incomeStartYear', String(current))
  localStorage.setItem('incomeSources', JSON.stringify([
    { name: 'Job', type: 'Employment', amount: 1000, frequency: 1, growth: 0, taxRate: 0, startYear: current }
  ]))
  render(
    <FinanceProvider>
      <PVDisplay years={5} />
    </FinanceProvider>
  )
  expect(Number(screen.getByTestId('pv').textContent)).toBeCloseTo(5000)
})

test('salary without endYear ends at retirement age', async () => {
  const current = new Date().getFullYear()
  localStorage.setItem('settings', JSON.stringify({ inflationRate: 0, retirementAge: 65 }))
  localStorage.setItem('profile', JSON.stringify({ age: 60, lifeExpectancy: 90 }))
  localStorage.setItem('incomeStartYear', String(current))
  localStorage.setItem('incomeSources', JSON.stringify([
    { name: 'Job', type: 'Salary', amount: 1000, frequency: 1, growth: 0, taxRate: 0, startYear: current }
  ]))
  render(
    <FinanceProvider>
      <SalaryEnd />
      <PVDisplay years={10} />
    </FinanceProvider>
  )
  const diff = 66 - 60
  await waitFor(() => Number(screen.getByTestId('end').textContent) > 0)
  expect(Number(screen.getByTestId('end').textContent)).toBe(current + diff - 1)
  expect(Number(screen.getByTestId('pv').textContent)).toBeCloseTo(6000)
})
