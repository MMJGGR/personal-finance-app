/* global test, expect, beforeAll, afterEach */
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import storage from '../utils/storage'
import { FinanceProvider, useFinance } from '../FinanceContext'
import AdequacyAlert from '../AdequacyAlert'

beforeAll(() => {
  global.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} }
})

afterEach(() => {
  localStorage.clear()
})

test('renders nothing when no gaps', async () => {
  localStorage.setItem('currentPersonaId', 'hadi')
  storage.setPersona('hadi')
  localStorage.setItem('settings-hadi', JSON.stringify({ startYear: 2025 }))
  localStorage.setItem('profile-hadi', JSON.stringify({ age: 30, lifeExpectancy: 31, nationality: 'Kenyan' }))
  localStorage.setItem('incomeSources-hadi', JSON.stringify([]))
  localStorage.setItem('expensesList-hadi', JSON.stringify([]))
  function Wrapper({ children }) {
    const { setYears } = useFinance()
    React.useEffect(() => { setYears(1) }, [setYears])
    return children
  }
  const { container } = render(
    <FinanceProvider>
      <Wrapper>
        <AdequacyAlert />
      </Wrapper>
    </FinanceProvider>
  )
  await waitFor(() => expect(container.firstChild).toBeNull())
})

test('shows funding gaps table', async () => {
  localStorage.setItem('currentPersonaId', 'hadi')
  storage.setPersona('hadi')
  localStorage.setItem('settings-hadi', JSON.stringify({ startYear: 2025 }))
  localStorage.setItem('profile-hadi', JSON.stringify({ age: 30, lifeExpectancy: 32, nationality: 'Kenyan' }))
  localStorage.setItem(
    'incomeSources-hadi',
    JSON.stringify([{ name: 'Job', amount: 1000, frequency: 1, growth: 0, taxRate: 0 }])
  )
  localStorage.setItem(
    'expensesList-hadi',
    JSON.stringify([{ name: 'Big', amount: 1500, paymentsPerYear: 1, growth: 0, priority: 1 }])
  )
  function Wrapper({ children }) {
    const { setYears } = useFinance()
    React.useEffect(() => { setYears(2) }, [setYears])
    return children
  }
  const { container } = render(
    <FinanceProvider>
      <Wrapper>
        <AdequacyAlert />
      </Wrapper>
    </FinanceProvider>
  )
  await screen.findByText('Adequacy Alert')
  expect(screen.getAllByRole('row')).toHaveLength(3)
  expect(container.firstChild).toMatchSnapshot()
})

test('renders custom message when provided', () => {
  render(
    <FinanceProvider>
      <AdequacyAlert message="Consider insurance" />
    </FinanceProvider>
  )
  expect(screen.getByText('Adequacy Alert')).toBeInTheDocument()
  expect(screen.getByText('Consider insurance')).toBeInTheDocument()
})
