import React from 'react'
import { useFinance } from './FinanceContext'
import { computeEmergencyFund, computeLifeCover } from './utils/insuranceUtils'
import { formatCurrency } from './utils/formatters'

export default function InsuranceTab() {
  const { monthlyExpense, profile, settings } = useFinance()

  const emergencyAmount = computeEmergencyFund(
    monthlyExpense,
    profile.numDependents
  )
  const emergencyMonths =
    monthlyExpense > 0 ? Math.round(emergencyAmount / monthlyExpense) : 0

  const lifeCover = computeLifeCover(
    profile.annualIncome,
    profile.numDependents,
    (profile.maritalStatus || 'single').toLowerCase()
  )

  return (
    <div className="space-y-6 p-6">
      <h2 className="text-2xl font-bold text-amber-700">
        Insurance Recommendations
      </h2>
      <div className="space-y-2 text-slate-700">
        <p>
          Emergency Fund:&nbsp;
          <strong>{emergencyMonths}</strong> months (~
          <strong>
            {formatCurrency(
              emergencyAmount,
              settings.locale,
              settings.currency
            )}
          </strong>
          )
        </p>
        <p>
          Recommended Life Cover:&nbsp;
          <strong>
            {formatCurrency(lifeCover, settings.locale, settings.currency)}
          </strong>
        </p>
      </div>
    </div>
  )
}
