import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { FinanceProvider, useFinance } from '../FinanceContext'
import BalanceSheetTab from '../components/BalanceSheet/BalanceSheetTab'

beforeAll(() => {
  global.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} }
})

afterEach(() => { localStorage.clear() })

function Controls() {
  const { assetsList, setAssetsList, liabilitiesList, setLiabilitiesList } = useFinance()
  const updateAsset = () => {
    setAssetsList(prev => prev.map((a, i) => i === 0 ? { ...a, amount: 2000 } : a))
  }
  const updateLiability = () => {
    setLiabilitiesList(prev => prev.map((l, i) => i === 0 ? { ...l, amount: 300, principal: 300 } : l))
  }
  return (
    <div>
      <button data-testid="asset" onClick={updateAsset}>asset</button>
      <button data-testid="liability" onClick={updateLiability}>liability</button>
    </div>
  )
}

test('net worth updates when registry values change', async () => {
  const now = new Date().getFullYear()
  localStorage.setItem('currentPersonaId', 'hadi')
  localStorage.setItem('profile-hadi', JSON.stringify({ age:30, lifeExpectancy:85, nationality:'Kenyan' }))
  localStorage.setItem('settings-hadi', JSON.stringify({ startYear: now }))
  localStorage.setItem('incomeSources-hadi', '[]')
  localStorage.setItem('expensesList-hadi', '[]')
  localStorage.setItem('goalsList-hadi', '[]')
  localStorage.setItem('assetsList-hadi', JSON.stringify([
    { id:'a1', name:'Cash', amount:1000, type:'Cash', expectedReturn:0, volatility:0, horizonYears:0, purchaseYear: now, saleYear:null, principal:1000 },
    { id:'pv-income', name:'PV of Lifetime Income', amount:0, type:'Income', expectedReturn:0, volatility:0, horizonYears:0, purchaseYear: now, saleYear:null, principal:0 }
  ]))
  localStorage.setItem('liabilitiesList-hadi', JSON.stringify([
    { id:'l1', name:'Loan', amount:500, principal:500, interestRate:0, termYears:1, paymentsPerYear:12, extraPayment:0, startYear: now, endYear:null, include:true }
  ]))

  render(
    <FinanceProvider>
      <BalanceSheetTab />
      <Controls />
    </FinanceProvider>
  )

  const netNode = await screen.findByTestId('net-worth')
  expect(netNode.textContent).toBe('KES\u00a0500.00')

  fireEvent.click(screen.getByTestId('asset'))
  await waitFor(() => expect(netNode.textContent).toBe('KES\u00a01,500.00'))

  fireEvent.click(screen.getByTestId('liability'))
  await waitFor(() => expect(netNode.textContent).toBe('KES\u00a01,700.00'))
})
