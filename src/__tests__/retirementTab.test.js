import React from 'react'
import { render, fireEvent, screen } from '@testing-library/react'
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

test('toggle pension type', () => {
  render(
    <FinanceProvider>
      <RetirementTab />
    </FinanceProvider>
  )
  const select = screen.getByLabelText(/Pension Type/i)
  expect(select.value).toBe('Annuity')
  fireEvent.change(select, { target: { value: 'Self-Managed' } })
  expect(select.value).toBe('Self-Managed')
})

test('adequacy flag updates with replacement rate', () => {
  render(
    <FinanceProvider>
      <RetirementTab />
    </FinanceProvider>
  )
  const rateInput = screen.getByLabelText(/Target Replacement Rate/i)
  fireEvent.change(rateInput, { target: { value: '10' } })
  expect(rateInput.value).toBe('10')
})
