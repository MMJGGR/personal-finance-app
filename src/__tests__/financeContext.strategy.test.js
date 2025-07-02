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

function ScoreDisplay() {
  const { riskScore } = useFinance()
  return <div data-testid="score">{riskScore}</div>
}

test('strategy is derived when risk score loads from storage', async () => {
  localStorage.setItem('currentPersonaId', 'hadi')
  localStorage.setItem('riskScore-hadi', '31')
  localStorage.setItem('profile-hadi', JSON.stringify({ investmentHorizon: '3–7 years' }))
  render(
    <FinanceProvider>
      <StrategyDisplay />
    </FinanceProvider>
  )
  const out = await screen.findByTestId('strategy')
  expect(out.textContent).toBe('Balanced')
})

test('existing strategy is preserved', async () => {
  localStorage.setItem('currentPersonaId', 'hadi')
  localStorage.setItem('strategy-hadi', 'Growth')
  localStorage.setItem('riskScore-hadi', '5')
  localStorage.setItem('profile-hadi', JSON.stringify({ investmentHorizon: '3–7 years' }))
  render(
    <FinanceProvider>
      <StrategyDisplay />
    </FinanceProvider>
  )
  const out = await screen.findByTestId('strategy')
  expect(out.textContent).toBe('Growth')
})

test('legacy risk score is migrated', async () => {
  localStorage.setItem('currentPersonaId', 'hadi')
  localStorage.setItem('riskScore-hadi', '8')
  localStorage.setItem(
    'profile-hadi',
    JSON.stringify({
      birthDate: '1990-01-01',
      annualIncome: 500000,
      netWorth: 300000,
      yearsInvesting: 5,
      employmentStatus: 'Employed',
      emergencyFundMonths: 6,
      riskSurveyAnswers: Array(10).fill(3),
      investmentKnowledge: 'Moderate',
      lossResponse: 'Wait',
      investmentHorizon: '>7 years',
      investmentGoal: 'Growth',
    })
  )
  render(
    <FinanceProvider>
      <ScoreDisplay />
    </FinanceProvider>
  )
  const out = await screen.findByTestId('score')
  expect(Number(out.textContent)).toBeGreaterThan(12)
  expect(localStorage.getItem('riskScore-hadi')).toBe(out.textContent)
})
