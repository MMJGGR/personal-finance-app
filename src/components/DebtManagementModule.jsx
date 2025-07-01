import React, { useMemo } from 'react'
import { formatCurrency } from '../utils/formatters.js'
import { calculateLoanSchedule } from '../modules/loan/loanCalculator.js'
import { suggestLoanStrategies } from '../modules/loan/loanStrategies.js'

export default function DebtManagementModule({
  liabilitiesList,
  settings,
  profile,
}) {
  const { locale, currency } = settings

  const liabilityDetails = useMemo(() => {
    return liabilitiesList.filter(l => l.include !== false).map(l => {
      const start = new Date((l.startYear ?? new Date().getFullYear()), 0, 1).getTime()
      const sched = calculateLoanSchedule({
        principal: Number(l.principal) || 0,
        annualRate: (Number(l.interestRate) || 0) / 100,
        termYears: Number(l.termYears) || 0,
        paymentsPerYear: l.paymentsPerYear,
        extraPayment: Number(l.extraPayment) || 0
      }, start)

      const totalInterestPaid = sched.payments.reduce((sum, p) => sum + p.interestPaid, 0)
      const totalPrincipalPaid = sched.payments.reduce((sum, p) => sum + p.principalPaid, 0)

      return { ...l, schedule: sched.payments, totalInterestPaid, totalPrincipalPaid }
    })
  }, [liabilitiesList])

  const loanStrategies = useMemo(() => {
    return suggestLoanStrategies(liabilitiesList, settings.expectedReturn, profile.age, profile.lifeExpectancy)
  }, [liabilitiesList, settings.expectedReturn, profile.age, profile.lifeExpectancy])

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-slate-700">Debt Overview</h3>
      {liabilitiesList.length === 0 ? (
        <p className="italic text-slate-500">No liabilities added.</p>
      ) : (
        liabilitiesList.map(liab => (
          <div key={liab.id} className="bg-white p-4 rounded-lg shadow">
            <h4 className="font-bold">{liab.name}</h4>
            <p>Principal: {formatCurrency(liab.principal, locale, currency)}</p>
            <p>Interest Rate: {liab.interestRate}%</p>
            <p>Term: {liab.termYears} years</p>
            <p>Monthly Payment: {formatCurrency(liab.computedPayment, locale, currency)}</p>
            {liabilityDetails.find(d => d.id === liab.id) && (
              <p>Total Interest Paid: {formatCurrency(liabilityDetails.find(d => d.id === liab.id).totalInterestPaid, locale, currency)}</p>
            )}
            {/* Amortization Schedule (simplified view) */}
            <details className="mt-2">
              <summary className="cursor-pointer text-amber-700">View Amortization Schedule</summary>
              <div className="overflow-x-auto mt-2">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pmt No.</th>
                      <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-2 py-1 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                      <th className="px-2 py-1 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Principal</th>
                      <th className="px-2 py-1 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Interest</th>
                      <th className="px-2 py-1 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {liabilityDetails.find(d => d.id === liab.id)?.schedule.slice(0, 12).map((p, idx) => ( // Show first 12 payments
                      <tr key={idx}>
                        <td className="px-2 py-1 whitespace-nowrap text-xs">{p.paymentNumber}</td>
                        <td className="px-2 py-1 whitespace-nowrap text-xs">{new Date(p.date).toLocaleDateString(locale)}</td>
                        <td className="px-2 py-1 whitespace-nowrap text-xs text-right">{formatCurrency(p.payment, locale, currency)}</td>
                        <td className="px-2 py-1 whitespace-nowrap text-xs text-right">{formatCurrency(p.principalPaid, locale, currency)}</td>
                        <td className="px-2 py-1 whitespace-nowrap text-xs text-right">{formatCurrency(p.interestPaid, locale, currency)}</td>
                        <td className="px-2 py-1 whitespace-nowrap text-xs text-right">{formatCurrency(p.balance, locale, currency)}</td>
                      </tr>
                    ))}
                    {liabilityDetails.find(d => d.id === liab.id)?.schedule.length > 12 && (
                      <tr>
                        <td colSpan="6" className="px-2 py-1 text-xs text-center italic">... {liabilityDetails.find(d => d.id === liab.id).schedule.length - 12} more payments ...</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </details>
          </div>
        ))
      )}

      {loanStrategies.length > 0 && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold text-slate-700">Loan Strategies</h3>
          <ul className="list-disc pl-5 space-y-2">
            {loanStrategies.map((strategy, index) => (
              <li key={index} className="text-sm">
                <strong>{strategy.name}:</strong> {strategy.description} (Interest Saved: {formatCurrency(strategy.interestSaved, locale, currency)})
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
