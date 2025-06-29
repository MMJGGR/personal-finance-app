import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { FinanceProvider, useFinance } from '../FinanceContext'

beforeAll(() => {
  global.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} }
})

afterEach(() => {
  localStorage.clear()
})

function Controls() {
  const { assetsList, setAssetsList } = useFinance()
  const asset = assetsList[0]
  return (
    <div>
      <button
        onClick={() =>
          setAssetsList([{ ...asset, purchaseYear: 2020 }])
        }
        data-testid="set-purchase"
      />
      <button
        onClick={() => setAssetsList([{ ...asset, saleYear: 2030 }])}
        data-testid="set-sale"
      />
      <button
        onClick={() => setAssetsList([{ ...asset, principal: 12345 }])}
        data-testid="set-principal"
      />
    </div>
  )
}

function Values() {
  const { assetsList } = useFinance()
  const asset = assetsList[0]
  return (
    <>
      <div data-testid="purchase-year">{asset.purchaseYear}</div>
      <div data-testid="sale-year">{asset.saleYear}</div>
      <div data-testid="principal">{asset.principal}</div>
    </>
  )
}

test('asset fields persist to localStorage and restore on reload', () => {
  localStorage.setItem('currentPersonaId', 'hadi')
  const { unmount } = render(
    <FinanceProvider>
      <Controls />
      <Values />
    </FinanceProvider>
  )

  fireEvent.click(screen.getByTestId('set-purchase'))
  fireEvent.click(screen.getByTestId('set-sale'))
  fireEvent.click(screen.getByTestId('set-principal'))

  const stored = JSON.parse(localStorage.getItem('assetsList-hadi'))[0]
  expect(stored.purchaseYear).toBe(2020)
  expect(stored.saleYear).toBe(2030)
  expect(stored.principal).toBe(12345)

  unmount()

  render(
    <FinanceProvider>
      <Values />
    </FinanceProvider>
  )

  expect(screen.getByTestId('purchase-year').textContent).toBe('2020')
  expect(screen.getByTestId('sale-year').textContent).toBe('2030')
  expect(screen.getByTestId('principal').textContent).toBe('12345')
})
