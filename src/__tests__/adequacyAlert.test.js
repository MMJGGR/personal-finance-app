/* global test, expect, beforeAll, afterEach */
import React from 'react'
import { render, screen } from '@testing-library/react'
import { FinanceProvider, useFinance } from '../FinanceContext'
import AdequacyAlert from '../AdequacyAlert'

beforeAll(() => {
  global.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} }
})

afterEach(() => {
  localStorage.clear()
})

test('renders nothing when no gaps', () => {
  const { container } = render(
    <FinanceProvider>
      <AdequacyAlert />
    </FinanceProvider>
  )
  expect(container.firstChild).toBeNull()
})

test('shows funding gaps table', async () => {
  localStorage.setItem(
    'incomeSources',
    JSON.stringify([{ name: 'Job', amount: 1000, frequency: 1, growth: 0, taxRate: 0 }])
  )
  localStorage.setItem(
    'expensesList',
    JSON.stringify([{ name: 'Big', amount: 1500, paymentsPerYear: 1, growth: 0, priority: 1 }])
  )
  function Wrapper({ children }) {
    const { setYears } = useFinance()
    React.useEffect(() => { setYears(2) }, [setYears])
    return children
  }
  const { container } = render(
    <FinanceProvider>
      <Wrapper>
        <AdequacyAlert />
      </Wrapper>
    </FinanceProvider>
  )
  await screen.findByText('Adequacy Alert')
  expect(screen.getAllByRole('row')).toHaveLength(3)
  expect(container.firstChild).toMatchSnapshot()
})
