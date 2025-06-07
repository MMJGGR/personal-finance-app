import React, { useMemo } from 'react'
import { useFinance } from './FinanceContext'
import { computeFundingGaps } from './engines/adequacy'
import { formatCurrency } from './utils/formatters'

export default function AdequacyAlert() {
  const { cumulativePV, startYear, settings } = useFinance()
  const gaps = useMemo(() => computeFundingGaps(cumulativePV), [cumulativePV])
  const rows = useMemo(
    () =>
      gaps
        .map((gap, i) => (gap > 0 ? { year: startYear + i, gap } : null))
        .filter(Boolean),
    [gaps, startYear]
  )
  if (rows.length === 0) return null
  return (
    <div
      id="adequacy-alert"
      className="bg-red-50 border border-red-300 p-4 rounded-lg"
    >
      <h3 className="text-red-700 font-semibold mb-2">Adequacy Alert</h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left">
            <th className="py-1 pr-2">Year</th>
            <th className="py-1">Funding Gap</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.year} className="border-t">
              <td className="py-1 pr-2">{r.year}</td>
              <td className="py-1 text-right">
                {formatCurrency(r.gap, settings.locale, settings.currency)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
