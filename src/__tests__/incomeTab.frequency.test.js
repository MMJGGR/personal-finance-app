import React from 'react'
import { render, screen } from '@testing-library/react'
import { FinanceProvider } from '../FinanceContext'
import IncomeTab from '../components/Income/IncomeTab'

beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
})

test('frequency input enforces minimum', () => {
  render(
    <FinanceProvider>
      <IncomeTab />
    </FinanceProvider>
  )

  const input = screen.getAllByLabelText('Payments per year')[0]
  expect(input).toHaveAttribute('min', '1')
})
