import React from 'react'
import { render } from '@testing-library/react'
import { FinanceProvider } from '../FinanceContext'
import StrategyTab from '../components/Strategy/StrategyTab'

beforeAll(() => {
  global.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} }
})

test('strategy tab placeholder snapshot', () => {
  const { container } = render(
    <FinanceProvider>
      <StrategyTab />
    </FinanceProvider>
  )
  expect(container.firstChild).toMatchSnapshot()
})
