import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import App from '../App'

beforeAll(() => {
  global.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} }
})

afterEach(() => {
  localStorage.clear()
})

test('displays single persona without delete controls', async () => {
  render(<App />)

  await screen.findByText(/Hadi Alsawad/i)
  expect(screen.queryByRole('button', { name: /Delete Persona/i })).not.toBeInTheDocument()
})

test('can add and remove personas', async () => {
  render(<App />)

  const addBtn = await screen.findByRole('button', { name: /Add Persona/i })
  fireEvent.click(addBtn)

  await screen.findByTitle('First Name')
  expect(screen.getAllByRole('button', { name: /Delete Persona/i }).length).toBe(2)

  const removeBtns = screen.getAllByRole('button', { name: /Delete Persona/i })
  fireEvent.click(removeBtns[1])

  await screen.findByText(/Hadi Alsawad/i)
  expect(screen.queryByRole('button', { name: /Delete Persona/i })).not.toBeInTheDocument()
})

test('edits persist to localStorage', async () => {
  const { unmount } = render(<App />)

  const addBtn = await screen.findByRole('button', { name: /Add Persona/i })
  fireEvent.click(addBtn)

  const firstName = await screen.findByTitle('First Name')
  fireEvent.change(firstName, { target: { value: 'Alex' } })

  const newId = localStorage.getItem('currentPersonaId')
  expect(JSON.parse(localStorage.getItem(`profile-${newId}`)).firstName).toBe('Alex')
  unmount()
  render(<App />)
  expect(localStorage.getItem(`profile-${newId}`)).toMatch('Alex')
})
