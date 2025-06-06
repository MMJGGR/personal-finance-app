import React from "react"
import { render, screen } from '@testing-library/react'
import AdviceDashboard from '../AdviceDashboard'
import { FinanceProvider } from '../FinanceContext'
import generateLoanAdvice from '../utils/loanAdvisoryEngine'
import calcDiscretionaryAdvice from '../utils/discretionaryUtils'

const loans = [
  { name: 'Loan', principal: 1000, interestRate: 5, termYears: 1, paymentsPerYear: 12 }
]
const expenses = [
  { name: 'Coffee', amount: 50, paymentsPerYear: 12, priority: 3 }
]

function renderDashboard(advice, discretionary = []) {
  return render(
    <FinanceProvider>
      <AdviceDashboard advice={advice} discretionaryAdvice={discretionary} loanStrategies={[]} />
    </FinanceProvider>
  )
}

test('dashboard hidden until advice provided', () => {
  const { rerender } = renderDashboard(null, [])
  expect(screen.queryByText('Advice Dashboard')).toBeNull()
  const advice = generateLoanAdvice(loans, { age: 30, totalPV: 1000 }, 1000, 900, 5, 5)
  const disc = calcDiscretionaryAdvice(expenses, 900, advice.monthlySurplus, 20)
  rerender(
    <FinanceProvider>
      <AdviceDashboard advice={advice} discretionaryAdvice={disc} loanStrategies={[]} />
    </FinanceProvider>
  )
  expect(screen.getByText('Advice Dashboard')).toBeInTheDocument()
  expect(screen.getByText(/Debt-to-Income Ratio:/)).toHaveTextContent(
    `Debt-to-Income Ratio: ${(advice.dti * 100).toFixed(1)}%`
  )
  expect(screen.getByText('Spending Advice')).toBeInTheDocument()
  expect(screen.getByText('Coffee')).toBeInTheDocument()
})
