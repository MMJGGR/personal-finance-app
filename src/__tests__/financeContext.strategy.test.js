import React from 'react'
import { render, screen } from '@testing-library/react'
import { FinanceProvider, useFinance } from '../FinanceContext'

beforeAll(() => {
  global.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} }
})

afterEach(() => {
  localStorage.clear()
})

function StrategyDisplay() {
  const { strategy } = useFinance()
  return <div data-testid="strategy">{strategy}</div>
}

test('strategy is derived when risk score loads from storage', async () => {
  localStorage.setItem('riskScore', '7')
  localStorage.setItem('profile', JSON.stringify({ investmentHorizon: '3–7 years' }))
  render(
    <FinanceProvider>
      <StrategyDisplay />
    </FinanceProvider>
  )
  const out = await screen.findByTestId('strategy')
  expect(out.textContent).toBe('Balanced')
})
