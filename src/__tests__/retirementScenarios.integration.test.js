import React, { useEffect } from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { FinanceProvider, useFinance } from '../FinanceContext'
import { calculatePensionIncome } from '../utils/pensionProjection'

beforeAll(() => {
  global.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} }
})

afterEach(() => {
  localStorage.clear()
})

function ScenarioView({ onToggle }) {
  const { incomeSources, assetsList, fundingFlag, settings, updateSettings } = useFinance()
  const income = incomeSources.find(s => s.id === 'pension-income')
  const asset = assetsList.find(a => a.id === 'projected-pension-value')
  useEffect(() => {
    if (onToggle) onToggle(() => updateSettings({ ...settings, pensionType: 'Annuity' }))
  }, [onToggle, updateSettings, settings])
  return (
    <div>
      <div data-testid="start">{income?.startYear}</div>
      <div data-testid="amount">{asset?.amount}</div>
      <div data-testid="flag">{fundingFlag || 'none'}</div>
      <div data-testid="has-income">{String(!!income)}</div>
      <div data-testid="has-asset">{String(!!asset)}</div>
      <button data-testid="toggle" onClick={() => updateSettings({ ...settings, pensionType: 'Annuity' })}>toggle</button>
    </div>
  )
}

test('Scenario 1: mid-career plan persists after reload', async () => {
  const year = new Date().getFullYear()
  localStorage.setItem('currentPersonaId', 'hadi')
  localStorage.setItem('profile-hadi', JSON.stringify({ age: 40, lifeExpectancy: 85, annualIncome: 100000 }))
  localStorage.setItem('settings-hadi', JSON.stringify({ retirementAge: 65, expectedReturn: 5, realReturn: 3, pensionType: 'Annuity', replacementRate: 70, discountRate: 5 }))
  localStorage.setItem('incomeSources-hadi', JSON.stringify([]))
  localStorage.setItem('privatePensionContributions-hadi', JSON.stringify([{ id: 'pp1', amount: 10000, frequency: 12, startYear: year }]))

  const { unmount } = render(
    <FinanceProvider>
      <ScenarioView />
    </FinanceProvider>
  )

  const startNode = await screen.findByTestId('start')
  const amountNode = screen.getByTestId('amount')
  const expectedStart = year + (65 - 40)
  expect(Number(startNode.textContent)).toBe(expectedStart)

  const storedAmount = Number(amountNode.textContent)
  unmount()

  render(
    <FinanceProvider>
      <ScenarioView />
    </FinanceProvider>
  )
  await screen.findByText(String(expectedStart))
  expect(Number(screen.getByTestId('amount').textContent)).toBeCloseTo(storedAmount)
})

test('Scenario 2: FIRE early retirement schedule computed', async () => {
  const year = new Date().getFullYear()
  localStorage.setItem('currentPersonaId', 'hadi')
  localStorage.setItem('profile-hadi', JSON.stringify({ age: 30, lifeExpectancy: 80, annualIncome: 80000 }))
  localStorage.setItem('settings-hadi', JSON.stringify({ retirementAge: 45, expectedReturn: 6, realReturn: 4, pensionType: 'Annuity', replacementRate: 60, discountRate: 4 }))
  localStorage.setItem('incomeSources-hadi', JSON.stringify([]))
  localStorage.setItem('privatePensionContributions-hadi', JSON.stringify([{ id: 'pp1', amount: 5000, frequency: 12, startYear: year, duration: 10 }]))

  render(
    <FinanceProvider>
      <ScenarioView />
    </FinanceProvider>
  )

  const expectedStart = year + (45 - 30)
  await screen.findByText(String(expectedStart))
})

test('Scenario 3: overfunded flag appears with large contributions', async () => {
  const year = new Date().getFullYear()
  localStorage.setItem('currentPersonaId', 'hadi')
  localStorage.setItem('profile-hadi', JSON.stringify({ age: 40, lifeExpectancy: 80, annualIncome: 50000 }))
  localStorage.setItem('settings-hadi', JSON.stringify({ retirementAge: 60, expectedReturn: 5, realReturn: 4, pensionType: 'Annuity', replacementRate: 70, discountRate: 5 }))
  localStorage.setItem('incomeSources-hadi', JSON.stringify([]))
  localStorage.setItem('privatePensionContributions-hadi', JSON.stringify([{ id: 'pp1', amount: 500000, frequency: 1, startYear: year }]))

  render(
    <FinanceProvider>
      <ScenarioView />
    </FinanceProvider>
  )

  await waitFor(() => screen.getByTestId('flag').textContent !== 'none')
  expect(screen.getByTestId('flag').textContent).toBe('overfunded')
})

test('Scenario 4: user switches from drawdown to annuity in session', async () => {
  const year = new Date().getFullYear()
  localStorage.setItem('currentPersonaId', 'hadi')
  localStorage.setItem('profile-hadi', JSON.stringify({ age: 40, lifeExpectancy: 80, annualIncome: 100000 }))
  localStorage.setItem('settings-hadi', JSON.stringify({ retirementAge: 65, expectedReturn: 5, realReturn: 4, pensionType: 'Self-Managed', replacementRate: 70, discountRate: 5 }))
  localStorage.setItem('incomeSources-hadi', JSON.stringify([]))
  localStorage.setItem('privatePensionContributions-hadi', JSON.stringify([{ id: 'pp1', amount: 5000, frequency: 12, startYear: year }]))

  render(
    <FinanceProvider>
      <ScenarioView />
    </FinanceProvider>
  )

  const hasIncome = await screen.findByTestId('has-income')
  expect(hasIncome.textContent).toBe('false')
  fireEvent.click(screen.getByTestId('toggle'))
  await waitFor(() => screen.getByTestId('has-income').textContent === 'true')
  await waitFor(() => screen.getByTestId('has-asset').textContent === 'true')
})

