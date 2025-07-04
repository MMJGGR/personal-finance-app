import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { FinanceProvider } from '../FinanceContext'
import ExportReportButton from '../components/ExportReportButton.jsx'
import seed from '../data/hadiExportTest.json'

beforeAll(() => {
  global.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} }
  global.URL.createObjectURL = () => 'blob:url'
  global.fetch = () => Promise.resolve({})
})

afterEach(() => { localStorage.clear() })

function seedData() {
  localStorage.setItem('currentPersonaId', 'test')
  localStorage.setItem('profile-test', JSON.stringify(seed.profile))
  localStorage.setItem('settings-test', JSON.stringify(seed.settings))
  localStorage.setItem('incomeSources-test', JSON.stringify(seed.incomeSources))
  localStorage.setItem('expensesList-test', JSON.stringify(seed.expenses))
  localStorage.setItem('goalsList-test', JSON.stringify(seed.goals))
  localStorage.setItem('liabilitiesList-test', JSON.stringify(seed.loans))
  localStorage.setItem('assetsList-test', JSON.stringify(seed.investments))
  localStorage.setItem('privatePensionContributions-test', JSON.stringify([{ id:'p1', name:'Pension', amount: seed.pension.monthlyContribution, frequency:12 }]))
}

test('export report includes key metrics', () => {
  seedData()
  const reports = []
  window.addEventListener('reportGenerated', e => reports.push(e.detail))
  render(
    <FinanceProvider>
      <ExportReportButton />
    </FinanceProvider>
  )
  fireEvent.click(screen.getByRole('button', { name: /export report/i }))
  const report = reports[0]
  expect(report.profile.name).toBe('Hadi Alsawad')
  expect(report.income).toHaveProperty('pvLifetime')
  expect(report.balanceSheet.netWorthTimeline.length).toBeGreaterThan(0)
  expect(report.insurance).toHaveProperty('emergencyFundNeeded')
})
