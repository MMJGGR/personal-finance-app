import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { FinanceProvider, useFinance } from '../FinanceContext'
import BalanceSheetTab from '../components/BalanceSheet/BalanceSheetTab'

beforeAll(() => {
  global.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} }
})

afterEach(() => {
  localStorage.clear()
})

function Display() {
  const { assetsList } = useFinance()
  const asset = assetsList[0]
  return <div data-testid="py-val">{asset.purchaseYear}</div>
}

test('purchaseYear input updates context', () => {
  localStorage.setItem('currentPersonaId', 'hadi')
  const { container } = render(
    <FinanceProvider>
      <BalanceSheetTab />
      <Display />
    </FinanceProvider>
  )

  // Expand first asset details
  const toggle = container.querySelector('button[aria-expanded]')
  if (toggle) fireEvent.click(toggle)
  const input = screen.getAllByLabelText('Purchase year')[0]
  fireEvent.change(input, { target: { value: '2010' } })
  expect(screen.getByTestId('py-val').textContent).toBe('2010')
})
