import React, { useMemo } from 'react'
import { useFinance } from '../FinanceContext'
import { formatCurrency } from '../utils/formatters'
import { suggestLoanStrategies } from '../modules/loan/loanStrategies'
import { calculateAmortizedPayment } from '../utils/financeUtils'

export default function StrategyTab() {
  const {
    profile,
    settings,
    incomeSources,
    expensesList,
    goalsList,
    liabilitiesList,
    assetsList,
    riskScore,
    strategy,
    monthlySurplusNominal,
  } = useFinance()

  const { locale, currency } = settings

  const totalAnnualIncome = useMemo(() => {
    return incomeSources.reduce((sum, src) => sum + src.amount * src.frequency, 0)
  }, [incomeSources])

  const totalAnnualExpenses = useMemo(() => {
    return expensesList.reduce((sum, exp) => sum + exp.amount * exp.paymentsPerYear, 0)
  }, [expensesList])

  const totalAnnualSavings = useMemo(() => {
    // This would ideally come from investmentContributions and pensionStreams
    // For now, a placeholder or derive from surplus
    return Math.max(0, totalAnnualIncome - totalAnnualExpenses)
  }, [totalAnnualIncome, totalAnnualExpenses])

  const loanStrategies = useMemo(() => {
    return suggestLoanStrategies(liabilitiesList, settings.expectedReturn, profile.age, profile.lifeExpectancy)
  }, [liabilitiesList, settings.expectedReturn, profile.age, profile.lifeExpectancy])

  return (
    <div className="bg-white rounded-xl shadow p-6 space-y-6">
      <h2 className="text-2xl font-semibold mb-4 text-amber-600">Financial Strategy & Recommendations</h2>

      <section>
        <h3 className="text-xl font-bold text-amber-800 mb-4">Your Financial Snapshot</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p><strong>Current Risk Profile:</strong> {profile.riskCapacity} Capacity, {profile.riskWillingness} Willingness</p>
            <p><strong>Calculated Risk Score:</strong> {riskScore}</p>
            <p><strong>Suggested Strategy:</strong> {strategy}</p>
          </div>
          <div>
            <p><strong>Total Annual Income:</strong> {formatCurrency(totalAnnualIncome, locale, currency)}</p>
            <p><strong>Total Annual Expenses:</strong> {formatCurrency(totalAnnualExpenses, locale, currency)}</p>
            <p><strong>Monthly Surplus:</strong> {formatCurrency(monthlySurplusNominal, locale, currency)}</p>
            <p><strong>Annual Savings/Surplus:</strong> {formatCurrency(totalAnnualSavings, locale, currency)}</p>
          </div>
        </div>
      </section>

      {loanStrategies.length > 0 && (
        <section>
          <h3 className="text-xl font-bold text-amber-800 mb-4">Loan Optimization Strategies</h3>
          <ul className="list-disc pl-5 space-y-2">
            {loanStrategies.map((strategy, index) => (
              <li key={index} className="text-sm">
                <strong>{strategy.name}:</strong> {strategy.description} (Potential Interest Saved: {formatCurrency(strategy.interestSaved, locale, currency)})
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h3 className="text-xl font-bold text-amber-800 mb-4">General Recommendations</h3>
        <ul className="list-disc pl-5 space-y-2">
          <li>Review your budget regularly to identify areas for potential savings.</li>
          <li>Consider increasing your emergency fund to cover at least 3-6 months of essential expenses.</li>
          <li>Explore investment options aligned with your risk profile and financial goals.</li>
          {monthlySurplusNominal < 0 && (
            <li>Your current spending exceeds your income. Prioritize reducing discretionary expenses.</li>
          )}
          {profile.lifeExpectancy - profile.age < 10 && (
            <li>With a shorter investment horizon, focus on capital preservation and income generation.</li>
          )}
        </ul>
      </section>

      {/* What-If Scenario Simulator (Placeholder) */}
      <section>
        <h3 className="text-xl font-bold text-amber-800 mb-4">What-If Scenario Simulator</h3>
        <div className="h-48 flex items-center justify-center text-gray-400 border border-dashed rounded-md">
          [Interactive charts and controls for simulating different financial scenarios]
        </div>
      </section>
    </div>
  )
}
