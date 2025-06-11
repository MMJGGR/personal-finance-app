import React, { useEffect } from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { FinanceProvider, useFinance } from '../FinanceContext'
import IncomeChart from '../IncomeChart'

beforeAll(() => {
  global.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} }
})

afterEach(() => {
  localStorage.clear()
})

function Wrapper({ children }) {
  const { setYears, updateSettings, settings } = useFinance()
  useEffect(() => {
    setYears(2)
    updateSettings({ ...settings, discountRate: 10 })
  }, [])
  return children
}

test('discounted chart snapshot', () => {
  localStorage.setItem('incomeSources', JSON.stringify([
    { name: 'Job', amount: 1000, frequency: 1, growth: 0, taxRate: 0 }
  ]))
  const { container } = render(
    <FinanceProvider>
      <Wrapper>
        <IncomeChart />
      </Wrapper>
    </FinanceProvider>
  )
  fireEvent.click(screen.getByRole('button', { name: /Discounted/i }))
  expect(container.firstChild).toMatchSnapshot()
})

test('toggle switches chart data', () => {
  localStorage.setItem('incomeSources', JSON.stringify([
    { name: 'Job', amount: 1000, frequency: 1, growth: 0, taxRate: 0 }
  ]))
  render(
    <FinanceProvider>
      <Wrapper>
        <IncomeChart />
      </Wrapper>
    </FinanceProvider>
  )
  const nominal = screen.getByRole('button', { name: /Nominal/i })
  const disc = screen.getByRole('button', { name: /Discounted/i })
  expect(nominal).toHaveClass('bg-amber-400')
  fireEvent.click(disc)
  expect(disc).toHaveClass('bg-amber-400')
})
