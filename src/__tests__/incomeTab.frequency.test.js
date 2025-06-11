import React from 'react'
import { render, screen } from '@testing-library/react'
import { FinanceProvider } from '../FinanceContext'
import IncomeTab from '../components/Income/IncomeTab'
import { FREQUENCY_LABELS } from '../constants'

beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
})

test('frequency dropdown offers valid choices', () => {
  render(
    <FinanceProvider>
      <IncomeTab />
    </FinanceProvider>
  )

  const select = screen.getAllByTitle('Payments per year')[0]
  const labels = Array.from(select.options).map(o => o.textContent)
  expect(labels).toEqual(FREQUENCY_LABELS)
})
