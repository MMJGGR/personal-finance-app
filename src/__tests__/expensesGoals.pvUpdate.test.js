import React from 'react'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { FinanceProvider } from '../FinanceContext'
import ExpensesGoalsTab from '../components/ExpensesGoals/ExpensesGoalsTab'
import { formatCurrency } from '../utils/formatters'

beforeAll(() => {
  global.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} }
})

afterEach(() => {
  localStorage.clear()
})

function setup() {
  localStorage.setItem('profile', JSON.stringify({ nationality: 'Kenyan', age: 30, lifeExpectancy: 85 }))
  localStorage.setItem('includeGoalsPV', 'true')
  localStorage.setItem('includeLiabilitiesNPV', 'true')
  return render(
    <FinanceProvider>
      <ExpensesGoalsTab />
    </FinanceProvider>
  )
}

test('adding an expense updates PV totals', async () => {
  setup()
  const label = await screen.findByText('PV of Expenses')
  const valueNode = label.nextSibling
  const initial = valueNode.textContent

  const addBtn = screen.getByRole('button', { name: 'Add expense' })
  fireEvent.click(addBtn)
  const amtInput = screen.getByTitle('Expense amount')
  fireEvent.change(amtInput, { target: { value: '100' } })

  const profile = JSON.parse(localStorage.getItem('profile'))
  const years = profile.lifeExpectancy - profile.age
  const expectedVal = formatCurrency(100 * 12 * years, 'en-US', 'KES').replace('KES', '')
  await waitFor(() => {
    expect(valueNode.textContent).toContain(expectedVal.trim())
  })
  expect(valueNode.textContent).not.toBe(initial)
})

test('adding a goal updates PV totals', async () => {
  setup()
  const label = await screen.findByText('PV of Goals')
  const valueNode = label.nextSibling
  const initial = valueNode.textContent

  const addBtn = screen.getByRole('button', { name: 'Add goal' })
  fireEvent.click(addBtn)
  const amtInput = screen.getByTitle('Goal amount')
  fireEvent.change(amtInput, { target: { value: '5000' } })

  const expectedVal = formatCurrency(5000, 'en-US', 'KES').replace('KES', '')
  await waitFor(() => {
    expect(valueNode.textContent).toContain(expectedVal.trim())
  })
  expect(valueNode.textContent).not.toBe(initial)
})

test('adding a loan updates PV totals', async () => {
  setup()
  const label = await screen.findByText('PV of Liabilities')
  const valueNode = label.nextSibling
  const initial = valueNode.textContent

  const addBtn = screen.getByRole('button', { name: 'Add liability' })
  fireEvent.click(addBtn)
  const inputs = screen.getAllByRole('spinbutton')
  fireEvent.change(inputs[0], { target: { value: '1000' } })
  fireEvent.change(inputs[1], { target: { value: '10' } })

  await waitFor(() => {
    expect(valueNode.textContent).not.toBe(initial)
  })
})
