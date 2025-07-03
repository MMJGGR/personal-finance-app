import React from 'react'
import { render, screen } from '@testing-library/react'
import { FinanceProvider, useFinance } from '../FinanceContext'

beforeAll(() => { global.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} } })

function ShowCount() {
  const { incomeSources } = useFinance()
  const has = incomeSources.some(s => s.id === 'pension-income')
  return <div data-testid="has-pension">{String(has)}</div>
}

test('pension income source added by context', () => {
  localStorage.setItem('currentPersonaId', 'hadi')
  localStorage.setItem('profile-hadi', JSON.stringify({ age: 40, lifeExpectancy: 80 }))
  localStorage.setItem('settings-hadi', JSON.stringify({ retirementAge: 65, expectedReturn: 5 }))
  localStorage.setItem('incomeSources-hadi', JSON.stringify([]))
  render(
    <FinanceProvider>
      <ShowCount />
    </FinanceProvider>
  )
  expect(screen.getByTestId('has-pension').textContent).toBe('true')
})
