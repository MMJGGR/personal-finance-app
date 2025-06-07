import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { FinanceProvider } from '../FinanceContext'
import IncomeTab from '../IncomeTab'

beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
})

test('frequency below 1 is corrected to 1', () => {
  render(
    <FinanceProvider>
      <IncomeTab />
    </FinanceProvider>
  )

  const input = screen.getAllByTitle('Payments per year')[0]
  fireEvent.change(input, { target: { value: '0' } })
  expect(input.value).toBe('1')
})
