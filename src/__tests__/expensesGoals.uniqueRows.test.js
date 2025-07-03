import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { FinanceProvider, useFinance } from '../FinanceContext'
import ExpensesGoalsTab from '../components/ExpensesGoals/ExpensesGoalsTab'
import storage from '../utils/storage'

beforeAll(() => {
  global.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} }
})

afterEach(() => {
  localStorage.clear()
})

function Reader() {
  const { expensesList } = useFinance()
  return (
    <>
      <div data-testid="count">{expensesList.length}</div>
      <div data-testid="id0">{expensesList[0]?.id}</div>
      <div data-testid="id1">{expensesList[1]?.id}</div>
      <div data-testid="name0">{expensesList[0]?.name}</div>
      <div data-testid="name1">{expensesList[1]?.name}</div>
      <div data-testid="amt0">{expensesList[0]?.amount}</div>
      <div data-testid="amt1">{expensesList[1]?.amount}</div>
    </>
  )
}

function setup() {
  localStorage.setItem('currentPersonaId', 'hadi')
  storage.setPersona('hadi')
  localStorage.setItem('profile-hadi', JSON.stringify({ nationality: 'Kenyan', age: 30, lifeExpectancy: 80 }))
  localStorage.setItem('expensesList-hadi', JSON.stringify([]))
  localStorage.setItem('goalsList-hadi', JSON.stringify([]))
  localStorage.setItem('liabilitiesList-hadi', JSON.stringify([]))
  return render(
    <FinanceProvider>
      <ExpensesGoalsTab />
      <Reader />
    </FinanceProvider>
  )
}

test('added expenses have unique ids and preserve edits', async () => {
  setup()
  await screen.findByText('PV of Expenses')

  fireEvent.click(screen.getByRole('button', { name: 'Clear lists' }))

  const addBtn = screen.getByRole('button', { name: 'Add expense' })
  fireEvent.click(addBtn)
  fireEvent.click(addBtn)

  const nameInputs = screen.getAllByLabelText('Expense name')
  const amtInputs = screen.getAllByLabelText('Expense amount')

  fireEvent.change(nameInputs[0], { target: { value: 'Coffee' } })
  fireEvent.change(amtInputs[0], { target: { value: '10' } })

  fireEvent.change(nameInputs[1], { target: { value: 'Tea' } })
  fireEvent.change(amtInputs[1], { target: { value: '20' } })

  await waitFor(() => expect(screen.getByTestId('count').textContent).toBe('2'))
  const id0 = screen.getByTestId('id0').textContent
  const id1 = screen.getByTestId('id1').textContent

  expect(id0).not.toBe(id1)
  expect(screen.getByTestId('name0').textContent).toBe('Coffee')
  expect(screen.getByTestId('name1').textContent).toBe('Tea')
  expect(screen.getByTestId('amt0').textContent).toBe('10')
  expect(screen.getByTestId('amt1').textContent).toBe('20')
})
