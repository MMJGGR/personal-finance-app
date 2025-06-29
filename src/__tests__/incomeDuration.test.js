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
  localStorage.setItem('currentPersonaId', 'hadi')
  localStorage.setItem('settings-hadi', JSON.stringify({ inflationRate: 0, startYear: current }))
  localStorage.setItem('incomeSources-hadi', JSON.stringify([
    { name: 'Contract', type: 'Employment', amount: 1000, frequency: 1, growth: 0, taxRate: 0, startYear: current, endYear: current + 1 }
  ]))
  render(
    <FinanceProvider>
      <PVDisplay years={5} />
    </FinanceProvider>
  )
  expect(Number(screen.getByTestId('pv').textContent)).toBeGreaterThan(0)
})

test('income without endYear persists through horizon', () => {
  const current = new Date().getFullYear()
  localStorage.setItem('currentPersonaId', 'hadi')
  localStorage.setItem('settings-hadi', JSON.stringify({ inflationRate: 0, startYear: current }))
  localStorage.setItem('incomeSources-hadi', JSON.stringify([
    { name: 'Job', type: 'Employment', amount: 1000, frequency: 1, growth: 0, taxRate: 0, startYear: current }
  ]))
  render(
    <FinanceProvider>
      <PVDisplay years={5} />
    </FinanceProvider>
  )
  expect(Number(screen.getByTestId('pv').textContent)).toBeGreaterThan(0)
})

test('salary without endYear ends at retirement age', async () => {
  const current = new Date().getFullYear()
  localStorage.setItem('currentPersonaId', 'hadi')
  localStorage.setItem('settings-hadi', JSON.stringify({ inflationRate: 0, retirementAge: 65, startYear: current }))
  localStorage.setItem('profile-hadi', JSON.stringify({ age: 60, lifeExpectancy: 90 }))
  localStorage.setItem('incomeSources-hadi', JSON.stringify([
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
  expect(Number(screen.getByTestId('pv').textContent)).toBeGreaterThan(0)
})

test('linked asset sale year caps income', () => {
  const current = new Date().getFullYear()
  localStorage.setItem('currentPersonaId', 'hadi')
  localStorage.setItem('settings-hadi', JSON.stringify({ inflationRate: 0, startYear: current }))
  localStorage.setItem('assetsList-hadi', JSON.stringify([
    { id: 'a1', name: 'House', amount: 0, type: 'Property', purchaseYear: current, saleYear: current + 2, principal: 100000 }
  ]))
  localStorage.setItem('incomeSources-hadi', JSON.stringify([
    { name: 'Rent', type: 'Rental', amount: 1000, frequency: 1, growth: 0, taxRate: 0, startYear: current, linkedAssetId: 'a1' }
  ]))
  render(
    <FinanceProvider>
      <PVDisplay years={5} />
    </FinanceProvider>
  )
  expect(Number(screen.getByTestId('pv').textContent)).toBeGreaterThan(0)
})

test('manual endYear overrides linked asset', () => {
  const current = new Date().getFullYear()
  localStorage.setItem('currentPersonaId', 'hadi')
  localStorage.setItem('settings-hadi', JSON.stringify({ inflationRate: 0, startYear: current }))
  localStorage.setItem('assetsList-hadi', JSON.stringify([
    { id: 'a2', name: 'Bond', amount: 0, type: 'Bond', purchaseYear: current, saleYear: current + 1, principal: 10000 }
  ]))
  localStorage.setItem('incomeSources-hadi', JSON.stringify([
    { name: 'Interest', type: 'Bond', amount: 1000, frequency: 1, growth: 0, taxRate: 0, startYear: current, endYear: current + 2, linkedAssetId: 'a2' }
  ]))
  render(
    <FinanceProvider>
      <PVDisplay years={5} />
    </FinanceProvider>
  )
  expect(Number(screen.getByTestId('pv').textContent)).toBeGreaterThan(0)
})
