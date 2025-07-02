import React from 'react'
import { render, screen } from '@testing-library/react'
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
