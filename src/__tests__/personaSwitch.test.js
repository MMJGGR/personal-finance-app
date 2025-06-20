import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import App from '../App'

beforeAll(() => {
  global.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} }
})

afterEach(() => {
  localStorage.clear()
})

test('switching personas updates profile and income tabs', async () => {
  render(<App />)

  // initial persona is hadi
  await screen.findByText(/Hadi Mwangi/i)

  // switch to Amina via dropdown
  fireEvent.change(screen.getByLabelText(/Persona/i), { target: { value: 'amina' } })

  // profile tab shows new name
  await screen.findByText(/Amina Okoth/i)
  await waitFor(() => expect(localStorage.getItem('currentPersonaId')).toBe('amina'))

  // open Income tab so FinanceProvider loads income data
  fireEvent.click(screen.getByRole('tab', { name: /Income/i }))
  await screen.findByText(/Income Sources/i)
  await waitFor(() => {
    const stored = JSON.parse(localStorage.getItem('incomeSources'))
    expect(stored[0].name).toBe('Consulting')
  })
})
