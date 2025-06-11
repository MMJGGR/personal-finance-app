import React from 'react'
import { render } from '@testing-library/react'
import { FinanceProvider } from '../FinanceContext'
import RetirementTab from '../components/Retirement/RetirementTab'

beforeAll(() => {
  global.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} }
})

test('retirement tab placeholder snapshot', () => {
  const { container } = render(
    <FinanceProvider>
      <RetirementTab />
    </FinanceProvider>
  )
  expect(container.firstChild).toMatchSnapshot()
})
