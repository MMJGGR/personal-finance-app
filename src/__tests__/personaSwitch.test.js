import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import App from '../App'

beforeAll(() => {
  global.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} }
})

afterEach(() => {
  localStorage.clear()
})

test('displays single persona without dropdown', async () => {
  render(<App />)

  await screen.findByText(/Hadi Alsawad/i)
  expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
})

test('can add and remove personas', async () => {
  render(<App />)

  const addBtn = await screen.findByRole('button', { name: /Add Persona/i })
  fireEvent.click(addBtn)

  const select = await screen.findByRole('combobox')
  expect(select.options.length).toBe(2)

  const removeBtn = screen.getByRole('button', { name: /Remove Persona/i })
  fireEvent.click(removeBtn)

  await screen.findByText(/Hadi Alsawad/i)
  expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
})
