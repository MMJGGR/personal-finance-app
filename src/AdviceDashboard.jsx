import React from 'react'
import { useFinance } from './FinanceContext'

export default function AdviceDashboard({ advice, discretionaryAdvice = [], loanStrategies = [] }) {
  const { settings } = useFinance()
  if (!advice) return null
  const { survival = {}, dti } = advice
  return (
    <div className="bg-white rounded-xl shadow p-4 space-y-4">
      <h3 className="text-lg font-bold text-amber-700">Advice Dashboard</h3>
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1 text-sm">
          <p>
            Nominal Survival:&nbsp;
            <strong>{survival.nominal === Infinity ? '∞' : survival.nominal}</strong>
            {survival.nominal !== Infinity && '\u00A0months'}
          </p>
          <p>
            PV Survival:&nbsp;
            <strong>{survival.pv === Infinity ? '∞' : survival.pv}</strong>
            {survival.pv !== Infinity && '\u00A0months'}
          </p>
          <p>
            Debt-to-Income Ratio:&nbsp;
            <strong>{(dti * 100).toFixed(1)}%</strong>
          </p>
        </div>
        {discretionaryAdvice.length > 0 && (
          <div>
            <h4 className="font-semibold mb-1">Spending Advice</h4>
            <ul className="list-disc pl-5 space-y-1">
              {discretionaryAdvice.map((d, i) => (
                <li key={i} className="text-sm">
                  Cut <strong>{d.name}</strong> (~
                  {d.amount.toLocaleString(settings.locale, {
                    style: 'currency',
                    currency: settings.currency,
                    maximumFractionDigits: 0,
                  })}
                  /mo)
                </li>
              ))}
            </ul>
          </div>
        )}
        {loanStrategies.length > 0 && (
          <div>
            <h4 className="font-semibold mb-1">Loan Strategies</h4>
            <ul className="list-disc pl-5 space-y-1">
              {loanStrategies.map((s, i) => (
                <li key={i} className="text-sm">
                  Pay <strong>{s.name}</strong> early to save{' '}
                  {s.interestSaved.toLocaleString(settings.locale, {
                    style: 'currency',
                    currency: settings.currency,
                    maximumFractionDigits: 0,
                  })}
                  {s.paymentsSaved > 0 && ` and cut ${s.paymentsSaved} payments`}
                  .
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
