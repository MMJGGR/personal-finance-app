import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { FinanceProvider } from '../FinanceContext'
import ProfileTab from '../ProfileTab'

beforeAll(() => {
  // ensure ResizeObserver not required
  global.ResizeObserver = class { observe(){} unobserve(){} disconnect(){} }
})

afterEach(() => {
  localStorage.clear()
})

test('life expectancy below age is adjusted to age + 1', () => {
  render(
    <FinanceProvider>
      <ProfileTab />
    </FinanceProvider>
  )

  const ageInput = screen.getByTitle('Age')
  const lifeInput = screen.getByTitle('Life Expectancy')

  fireEvent.change(ageInput, { target: { value: '60' } })
  fireEvent.change(lifeInput, { target: { value: '58' } })

  expect(lifeInput.value).toBe('61')
})

test('increasing age past expectancy adjusts expectancy', () => {
  render(
    <FinanceProvider>
      <ProfileTab />
    </FinanceProvider>
  )

  const ageInput = screen.getByTitle('Age')
  const lifeInput = screen.getByTitle('Life Expectancy')

  fireEvent.change(lifeInput, { target: { value: '40' } })
  fireEvent.change(ageInput, { target: { value: '41' } })

  expect(lifeInput.value).toBe('42')
})
