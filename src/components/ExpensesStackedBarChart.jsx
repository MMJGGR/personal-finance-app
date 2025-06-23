import React, { useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { useFinance } from '../FinanceContext'
import {
  generateRecurringFlows,
  frequencyToPayments,
} from '../utils/financeUtils'
import { getLoanFlowsByYear } from '../utils/loanHelpers'

export default function ExpensesStackedBarChart({ chartMode = 'nominal' }) {
  const {
    expensesList,
    goalsList,
    liabilitiesList,
    includeMediumPV,
    includeLowPV,
    includeGoalsPV,
    settings,
    startYear,
  } = useFinance()

  const BASE_COLORS = {
    Fixed: '#1f77b4',
    Variable: '#ff7f0e',
    Other: '#2ca02c',
    Goal: '#9467bd',
    'Debt Service': '#34d399',
  }

  const PALETTE = [
    '#e41a1c',
    '#377eb8',
    '#4daf4a',
    '#984ea3',
    '#ff7f00',
    '#a65628',
    '#f781bf',
    '#999999',
  ]

  // Aggregate expenses by year and category
  const filtered = expensesList.filter(e => {
    if (e.priority === 2 && !includeMediumPV) return false
    if (e.priority > 2 && !includeLowPV) return false
    return true
  })

  const dataByYear = {}
  filtered.forEach(exp => {
    const flows = generateRecurringFlows({
      amount: Number(exp.amount) || 0,
      paymentsPerYear:
        typeof exp.paymentsPerYear === 'number'
          ? exp.paymentsPerYear
          : typeof exp.frequency === 'number'
            ? exp.frequency
            : frequencyToPayments(exp.frequency),
      growth: Number(exp.growth ?? settings.inflationRate) || 0,
      startYear: exp.startYear,
      endYear: exp.endYear ?? exp.startYear,
    })

    flows.forEach(({ year, amount }) => {
      if (!dataByYear[year]) dataByYear[year] = { year: String(year) }
      dataByYear[year][exp.category] =
        (dataByYear[year][exp.category] || 0) + amount
    })
  })

  if (includeGoalsPV) {
    goalsList.forEach(g => {
      const yr = g.targetYear ?? g.endYear ?? g.startYear
      const year = Number(yr)
      if (year == null) return
      if (!dataByYear[year]) dataByYear[year] = { year: String(year) }
      dataByYear[year].Goal = (dataByYear[year].Goal || 0) + (Number(g.amount) || 0)
    })
  }

  const loanFlows = getLoanFlowsByYear(liabilitiesList)
  Object.entries(loanFlows).forEach(([year, amt]) => {
    const y = Number(year)
    if (!dataByYear[y]) dataByYear[y] = { year: String(y) }
    dataByYear[y]['Debt Service'] = (dataByYear[y]['Debt Service'] || 0) + amt
  })

  const nominalData = Object.values(dataByYear).sort((a, b) => a.year - b.year)

  const chartData = useMemo(() => {
    if (chartMode !== 'pv') return nominalData
    const rate = settings.discountRate ?? 0
    return nominalData.map(row => {
      const diff = Number(row.year) - startYear + 1
      const factor = Math.pow(1 + rate / 100, diff)
      const discounted = { year: row.year }
      Object.keys(row).forEach(k => {
        if (k === 'year') return
        discounted[k] = row[k] / factor
      })
      return discounted
    })
  }, [nominalData, chartMode, settings.discountRate, startYear])

  const categories = useMemo(() => {
    const set = new Set()
    filtered.forEach(e => set.add(e.category))
    if (includeGoalsPV && goalsList.length > 0) set.add('Goal')
    const baseOrder = ['Fixed', 'Variable', 'Other', 'Goal']
    const unique = [
      ...baseOrder.filter(c => set.has(c)),
      ...Array.from(set).filter(c => !baseOrder.includes(c)),
    ]
    return unique
  }, [filtered, goalsList, includeGoalsPV])

  const colorMap = useMemo(() => {
    const map = { ...BASE_COLORS }
    let i = 0
    categories.forEach(cat => {
      if (!map[cat]) {
        map[cat] = PALETTE[i % PALETTE.length]
        i += 1
      }
    })
    return map
  }, [categories])

  return (
    <div className="w-full h-80 bg-white p-4 rounded-xl shadow-md">
      <h3 className="text-lg font-semibold mb-2">Expenses Over Time</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="year" />
          <YAxis />
          <Tooltip />
          <Legend formatter={value => value} />
          {categories.map(cat => (
            <Bar key={cat} dataKey={cat} stackId="a" fill={colorMap[cat]} />
          ))}
          {Object.keys(loanFlows).length > 0 && (
            <Bar dataKey="Debt Service" stackId="a" fill="#34d399" />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
