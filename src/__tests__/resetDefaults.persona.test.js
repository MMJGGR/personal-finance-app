import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import App from '../App'

beforeAll(() => {
  global.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} }
})

afterEach(() => {
  localStorage.clear()
})

test('reset defaults restores persona seed data', async () => {
  render(<App />)

  // switch from default hadi to amina
  fireEvent.change(screen.getByLabelText(/Persona/i), { target: { value: 'amina' } })

  // open Income tab and wait for data
  fireEvent.click(screen.getByRole('tab', { name: /Income/i }))
  await screen.findByText(/Income Sources/i)
  await waitFor(() => screen.getAllByLabelText('Income source name').length > 0)

  let names = screen.getAllByLabelText('Income source name')
  expect(names[0]).toHaveValue('Consulting')
  fireEvent.change(names[0], { target: { value: 'Foo' } })
  expect(screen.getAllByLabelText('Income source name')[0]).toHaveValue('Foo')

  fireEvent.click(screen.getByRole('button', { name: /Reset Defaults/i }))
  await waitFor(() => expect(screen.getAllByLabelText('Income source name')[0]).toHaveValue('Consulting'))
  expect(screen.getAllByLabelText('Income source name').length).toBe(1)

  // open Expenses tab
  fireEvent.click(screen.getByRole('tab', { name: /Expenses & Goals/i }))
  await screen.findByText(/PV of Expenses/)
  await waitFor(() => screen.getAllByLabelText('Expense name').length > 0)

  let expNames = screen.getAllByLabelText('Expense name')
  expect(expNames[0]).toHaveValue('Rent')
  fireEvent.change(expNames[0], { target: { value: 'Other' } })
  expect(screen.getAllByLabelText('Expense name')[0]).toHaveValue('Other')

  fireEvent.click(screen.getByRole('button', { name: /Reset Defaults/i }))
  await waitFor(() => expect(screen.getAllByLabelText('Expense name')[0]).toHaveValue('Rent'))
  expect(screen.getAllByLabelText('Expense name').length).toBe(1)
})
