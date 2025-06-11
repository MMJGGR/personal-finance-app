import React from 'react'
import { render } from '@testing-library/react'
import { FinanceProvider } from '../FinanceContext'
import InvestmentsTab from '../components/Investments/InvestmentsTab'

beforeAll(() => {
  global.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} }
})

test('investments tab placeholder snapshot', () => {
  const { container } = render(
    <FinanceProvider>
      <InvestmentsTab />
    </FinanceProvider>
  )
  expect(container.firstChild).toMatchSnapshot()
})
