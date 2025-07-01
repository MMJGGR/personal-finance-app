import React from 'react'
import { useFinance } from '../../FinanceContext'
import { computeEmergencyFund, computeLifeCover, computeDisabilityCoverage, computeHealthCoverage, computeLTCCoverage, computePropertyCasualtyCoverage } from '../../utils/insuranceCalculator.js'
import { formatCurrency } from '../../utils/formatters'
import Tooltip from '../Tooltip.jsx'

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

  const disabilityCoverage = computeDisabilityCoverage(profile.annualIncome);
  const healthCoverage = computeHealthCoverage(profile.age, profile.numDependents);
  const ltcCoverage = computeLTCCoverage(profile.age);
  const propertyCasualtyCoverage = computePropertyCasualtyCoverage(profile.liquidNetWorth, profile.liquidNetWorth); // Placeholder values

  return (
    <div className="space-y-6 p-6">
      <h2 className="text-2xl font-bold text-amber-800">
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
          <Tooltip content="An emergency fund covers unexpected expenses and provides a financial safety net. Recommended months of coverage vary based on dependents and expenses." />
        </p>
        <p>
          Recommended Life Cover:&nbsp;
          <strong>
            {formatCurrency(lifeCover, settings.locale, settings.currency)}
          </strong>
          <Tooltip content="Life insurance provides financial protection to your loved ones in the event of your death. The recommended coverage is often a multiple of your annual income, adjusted for dependents and marital status." />
        </p>
        <p>
          Recommended Disability Coverage:&nbsp;
          <strong>
            {formatCurrency(disabilityCoverage, settings.locale, settings.currency)}
          </strong>
          <Tooltip content="Disability insurance replaces a portion of your income if you're unable to work due to illness or injury." />
        </p>
        <p>
          Recommended Health Coverage:&nbsp;
          <strong>
            {formatCurrency(healthCoverage, settings.locale, settings.currency)}
          </strong>
          <Tooltip content="Health insurance covers medical expenses, including doctor visits, hospital stays, and prescription drugs." />
        </p>
        <p>
          Recommended Long-Term Care Coverage:&nbsp;
          <strong>
            {formatCurrency(ltcCoverage, settings.locale, settings.currency)}
          </strong>
          <Tooltip content="Long-term care insurance helps cover the costs of services like nursing home care, assisted living, or in-home care if you have a chronic illness or disability." />
        </p>
        <p>
          Recommended Property & Casualty Coverage:&nbsp;
          <strong>
            {formatCurrency(propertyCasualtyCoverage, settings.locale, settings.currency)}
          </strong>
          <Tooltip content="Property and casualty insurance protects your assets, such as your home and car, from damage or theft, and provides liability coverage." />
        </p>
      </div>
    </div>
  )
}
