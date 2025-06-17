import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import LifetimeStackedChart from '../components/ExpensesGoals/LifetimeStackedChart'

beforeAll(() => {
  global.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} }
})

test('series hide and show when toggled', () => {
  const data = [
    { year: 2024, income: 100, expenses: 50, goals: 20, debtService: 10 }
  ]
  const { container } = render(
    <LifetimeStackedChart data={data} locale="en-US" currency="USD" />
  )
  const selector = fill => container.querySelectorAll(`[fill='${fill}']`).length
  expect(selector('#fecaca')).toBe(1)
  const chk = screen.getByLabelText('expenses')
  fireEvent.click(chk)
  expect(selector('#fecaca')).toBe(0)
  fireEvent.click(chk)
  expect(selector('#fecaca')).toBe(1)
})
