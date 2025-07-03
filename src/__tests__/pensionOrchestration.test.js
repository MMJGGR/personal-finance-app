import React from 'react'
import { render, screen } from '@testing-library/react'
import { FinanceProvider, useFinance } from '../FinanceContext'

beforeAll(() => { global.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} } })

afterEach(() => { localStorage.clear() })

function View() {
  const { incomeSources, assetsList, strategy } = useFinance()
  const hasIncome = incomeSources.some(s => s.id === 'pension-income')
  const hasAsset = assetsList.some(a => a.id === 'projected-pension-value')
  return (
    <div>
      <div data-testid="has-income">{String(hasIncome)}</div>
      <div data-testid="has-asset">{String(hasAsset)}</div>
      <div data-testid="strategy">{strategy}</div>
    </div>
  )
}

test('annuity toggle adds pension income and asset and shifts strategy', async () => {
  const now = new Date().getFullYear()
  localStorage.setItem('currentPersonaId', 'hadi')
  localStorage.setItem('profile-hadi', JSON.stringify({ age:40, lifeExpectancy:80, annualIncome:100000 }))
  localStorage.setItem('settings-hadi', JSON.stringify({ retirementAge:65, expectedReturn:5, realReturn:3, pensionType:'Annuity', replacementRate:70, discountRate:5 }))
  localStorage.setItem('riskScore-hadi', '50')
  localStorage.setItem('incomeSources-hadi', JSON.stringify([]))
  localStorage.setItem('privatePensionContributions-hadi', JSON.stringify([{ id:'pp1', amount:5000, frequency:12 }]))

  render(
    <FinanceProvider>
      <View />
    </FinanceProvider>
  )

  const hasIncome = await screen.findByTestId('has-income')
  const hasAsset = await screen.findByTestId('has-asset')
  const strategy = await screen.findByTestId('strategy')
  expect(hasIncome.textContent).toBe('true')
  expect(hasAsset.textContent).toBe('true')
  expect(strategy.textContent).toBe('Conservative')
})

test('self-managed pension removes projections', async () => {
  const now = new Date().getFullYear()
  localStorage.setItem('currentPersonaId', 'hadi')
  localStorage.setItem('profile-hadi', JSON.stringify({ age:40, lifeExpectancy:80, annualIncome:100000 }))
  localStorage.setItem('settings-hadi', JSON.stringify({ retirementAge:65, expectedReturn:5, realReturn:3, pensionType:'Self-Managed', replacementRate:70, discountRate:5 }))
  localStorage.setItem('riskScore-hadi', '50')
  localStorage.setItem('incomeSources-hadi', JSON.stringify([]))
  localStorage.setItem('privatePensionContributions-hadi', JSON.stringify([{ id:'pp1', amount:5000, frequency:12 }]))

  render(
    <FinanceProvider>
      <View />
    </FinanceProvider>
  )

  const hasIncome = await screen.findByTestId('has-income')
  const hasAsset = await screen.findByTestId('has-asset')
  const strategy = await screen.findByTestId('strategy')
  expect(hasIncome.textContent).toBe('false')
  expect(hasAsset.textContent).toBe('false')
  expect(strategy.textContent).toBe('Balanced')
})
