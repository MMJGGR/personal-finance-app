import React, { useMemo, useState, useEffect } from 'react'
import { formatCurrency } from '../../utils/formatters'
import { useFinance } from '../../FinanceContext'
import { buildPlanJSON, buildPlanCSV, submitProfile } from '../../utils/exportHelpers'

import { buildCashflowTimeline } from '../../utils/cashflowTimeline'

import storage from '../../utils/storage'
import { appendAuditLog } from '../../utils/auditLog'
import sanitize from '../../utils/sanitize'
import { getLoanFlowsByYear } from '../../utils/loanHelpers'
import { estimateFutureValue } from '../../utils/financeUtils'
import { suggestLoanStrategies } from '../../modules/loan/loanStrategies'
import LTCMA from '../../ltcmaAssumptions'
import InvestmentStrategies from '../../investmentStrategies'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts'
import { usePersona } from '../../PersonaContext.jsx'
import CashflowTimelineChart from '../ExpensesGoals/CashflowTimelineChart.jsx'

const COLORS = ['#fbbf24', '#f59e0b', '#fde68a', '#eab308', '#fcd34d', '#fef3c7']

export default function BalanceSheetTab() {
  const {
    incomePV,
    expensesPV,
    cumulativePV,
    assetsList,
    setAssetsList,
    createAsset,
    liabilitiesList,
    setLiabilitiesList,
    createLiability,
    goalsList,
    expensesList,
    annualIncome,
    startYear,
    years,
    includeLiabilitiesNPV,
    discountRate,
    humanCapitalShare,
    settings,
    strategy,
    setStrategy,
  } = useFinance()
  const { currentData } = usePersona()
  const currentYear = new Date().getFullYear()

  const [expandedAssets, setExpandedAssets] = useState({})
  const [expandedLiabilities, setExpandedLiabilities] = useState({})
  const [chartMode, setChartMode] = useState('nominal')
  const [historicalNetWorth, setHistoricalNetWorth] = useState([])

  const assetReturn = useMemo(() => {
    const total = assetsList.reduce((s, a) => s + Number(a.amount || 0), 0)
    if (total === 0) return 0
    return assetsList.reduce(
      (sum, a) =>
        sum + ((Number(a.amount || 0) / total) * (Number(a.expectedReturn || 0))),
      0
    )
  }, [assetsList])

  const assetVol = useMemo(() => {
    const total = assetsList.reduce((s, a) => s + Number(a.amount || 0), 0)
    if (total === 0) return 0
    return assetsList.reduce(
      (sum, a) =>
        sum + ((Number(a.amount || 0) / total) * (Number(a.volatility || 0))),
      0
    )
  }, [assetsList])

  const assetFutureValue = useMemo(
    () =>
      assetsList.reduce(
        (sum, a) =>
          sum + estimateFutureValue(
            Number(a.amount) || 0,
            Number(a.expectedReturn) || 0,
            Number(a.horizonYears) || 0
          ),
        0
      ),
    [assetsList]
  )

  const strategyReturn = useMemo(() => {
    if (!strategy) return 0
    const weights = InvestmentStrategies[strategy]
    const totalW = Object.values(weights).reduce((a, b) => a + b, 0)
    return Object.entries(weights).reduce(
      (sum, [t, w]) => sum + ((w / totalW) * (LTCMA[t]?.expectedReturn || 0)),
      0
    )
  }, [strategy])

  const strategyVol = useMemo(() => {
    if (!strategy) return 0
    const weights = InvestmentStrategies[strategy]
    const totalW = Object.values(weights).reduce((a, b) => a + b, 0)
    return Object.entries(weights).reduce(
      (sum, [t, w]) => sum + ((w / totalW) * (LTCMA[t]?.volatility || 0)),
      0
    )
  }, [strategy])

  const loanStrategies = useMemo(
    () => suggestLoanStrategies(liabilitiesList.filter(l => l.include !== false)),
    [liabilitiesList]
  )

  // Keep PV of Lifetime Income in sync with context changes
  useEffect(() => {
    setAssetsList(prev => {
      const idx = prev.findIndex(a => a.id === 'pv-income')
      if (idx === -1) {
        return [...prev, { id: 'pv-income', name: 'PV of Lifetime Income', amount: incomePV }]
      }
      const updated = [...prev]
      updated[idx] = { ...updated[idx], amount: incomePV }
      return updated
    })
  }, [incomePV, setAssetsList])

  // Keep PV of Lifetime Expenses in sync with context changes
  useEffect(() => {
    setLiabilitiesList(prev => {
      const idx = prev.findIndex(l => l.id === 'pv-expenses')
      if (idx === -1) {
        return [...prev, { id: 'pv-expenses', name: 'PV of Lifetime Expenses', amount: expensesPV }]
      }
      const updated = [...prev]
      updated[idx] = { ...updated[idx], amount: expensesPV }
      return updated
    })
  }, [expensesPV, setLiabilitiesList])

  const totalAssets = assetsList.reduce((sum, a) => sum + Number(a.amount || 0), 0)
  const totalLiabilities = liabilitiesList.reduce(
    (sum, l) => sum + Number(l.amount || l.principal || 0),
    0
  )

  const pvIncome = assetsList.find(a => a.id === 'pv-income')?.amount || 0
  const pvExpenses = liabilitiesList.find(l => l.id === 'pv-expenses')?.amount || 0
  const baseNetWorth = totalAssets - pvIncome - (totalLiabilities - pvExpenses)
  const futurePV = cumulativePV[cumulativePV.length - 1] || 0
  const netWorth = baseNetWorth + futurePV
  const debtAssetRatio = totalAssets > 0 ? totalLiabilities / totalAssets : 0

  useEffect(() => {
    // Calculate historical net worth (simplified: assumes linear growth/decline)
    const yearsToProject = 10; // Project 10 years into the past
    const historicalData = [];
    for (let i = yearsToProject; i >= 0; i--) {
      const year = currentYear - i;
      // This is a very simplified calculation. A real historical net worth would require historical data.
      // For demonstration, we'll just interpolate backwards from current net worth.
      const interpolatedNetWorth = netWorth - (netWorth - (totalAssets - totalLiabilities)) * (i / yearsToProject);
      historicalData.push({ year, netWorth: interpolatedNetWorth });
    }
    setHistoricalNetWorth(historicalData);
  }, [netWorth, totalAssets, totalLiabilities, currentYear]);

  
  const pvGoals = useMemo(
    () =>
      goalsList.reduce((sum, g) => {
        const yrs = Math.max(0, g.targetYear - currentYear)
        return sum + g.amount / Math.pow(1 + discountRate / 100, yrs)
      }, 0),
    [goalsList, discountRate, currentYear]
  )

  const pvLiabilities = useMemo(
    () =>
      liabilitiesList.reduce(
        (sum, l) => sum + Number(l.amount || l.principal || 0),
        0
      ),
    [liabilitiesList]
  )

  const addAsset = () =>
    setAssetsList([...assetsList, createAsset()])
  const addLiability = () =>
    setLiabilitiesList([...liabilitiesList, createLiability()])

  const resetDefaults = () => {
    const now = new Date().getFullYear()
    if (currentData?.assetsList?.length) {
      const list = currentData.assetsList.map(a => ({
        id: crypto.randomUUID(),
        name: a.name,
        amount: a.amount ?? a.value ?? 0,
        type: a.type ?? '',
        expectedReturn:
          a.returnAssumptionPct ?? a.expectedReturn ?? a.return ?? 0,
        volatility: a.volatilityPct ?? a.volatility ?? 0,
        horizonYears: a.horizonYears ?? 0,
        purchaseYear: now,
        saleYear: null,
        principal: a.principal ?? a.amount ?? a.value ?? 0,
      }))
      setAssetsList(list)
    }
    if (currentData?.liabilitiesList?.length) {
      const list = currentData.liabilitiesList.map(l => ({
        id: crypto.randomUUID(),
        name: l.name,
        principal: l.principal ?? 0,
        interestRate: l.ratePct ?? l.interestRate ?? 0,
        termYears: l.termYears ?? Math.ceil((l.termMonths || 0) / 12),
        paymentsPerYear: l.paymentsPerYear ?? 12,
        extraPayment: l.extraPayment ?? 0,
        startYear: l.startYear ?? now,
        endYear: l.endYear ?? null,
        include: l.include !== false,
      }))
      setLiabilitiesList(list)
    }
  }

  const validateAsset = (asset, idx, list) => {
    if (
      list.some((a, i) => i !== idx && a.name && a.name.toLowerCase() === asset.name.toLowerCase())
    ) {
      alert('Asset names must be unique.')
      return false
    }
    const er = asset.expectedReturn ?? 0
    const vol = asset.volatility ?? 0
    if (er < 0 || er > 20 || vol < 0 || vol > 30) {
      alert('Expected return must be 0-20% and volatility 0-30%.')
      return false
    }
    return true
  }

  const updateItem = (setList, list, index, field, raw) => {
    const value = typeof raw === 'string' ? sanitize(raw) : raw
    const oldValue = list[index]?.[field]
    const updatedItem = {
      ...list[index],
      [field]:
        [
          'amount',
          'expectedReturn',
          'volatility',
          'horizonYears',
          'purchaseYear',
          'saleYear',
          'principal',
          'interestRate',
          'termYears',
          'paymentsPerYear',
          'extraPayment'
        ].includes(field)
          ? Number(value)
          : value,
    }
    if (setList === setAssetsList && field === 'type' && LTCMA[value]) {
      updatedItem.expectedReturn = LTCMA[value].expectedReturn
      updatedItem.volatility = LTCMA[value].volatility
    }
    const updated = list.map((it, i) => (i === index ? updatedItem : it))
    if (setList === setAssetsList && !validateAsset(updatedItem, index, list)) return
    setList(updated)
    const prefix = setList === setAssetsList ? 'asset' : 'liability'
    appendAuditLog(storage, {
      field: `${prefix}.${field}`,
      oldValue,
      newValue: updatedItem[field],
    })
  }

  const toggleAsset = id =>
    setExpandedAssets(prev => ({ ...prev, [id]: !prev[id] }))

  const toggleLiability = id =>
    setExpandedLiabilities(prev => ({ ...prev, [id]: !prev[id] }))

  const barData = [
    { name: 'Assets', value: totalAssets },
    { name: 'Liabilities', value: totalLiabilities },
    { name: 'Net Worth', value: netWorth }
  ]

  const assetPieData = assetsList.map(a => ({
    name: a.name,
    value: Number(a.amount || 0),
  }))

  const liabilityPieData = liabilitiesList.map(l => ({
    name: l.name,
    value: Number(l.amount || l.principal || 0),
  }))

  const humanVsFinancial = [
    { name: 'Human Capital', value: incomePV },
    { name: 'Financial Capital', value: totalAssets - incomePV },
  ]

  const loanFlows = useMemo(
    () => getLoanFlowsByYear(liabilitiesList),
    [liabilitiesList]
  )

  const timelineData = useMemo(() => {
    const minYear = startYear
    const maxYear = startYear + years - 1
    const incomeFn = y => {
      const idx = y - startYear
      return annualIncome[idx] || 0
    }
    const loanForYear = y =>
      includeLiabilitiesNPV ? loanFlows[y] || 0 : 0
    return buildCashflowTimeline(
      minYear,
      maxYear,
      incomeFn,
      expensesList,
      goalsList,
      loanForYear,
      settings.inflationRate
    )
  }, [
    annualIncome,
    startYear,
    years,
    expensesList,
    goalsList,
    loanFlows,
    includeLiabilitiesNPV,
    settings.inflationRate
  ])

  const timelinePV = useMemo(
    () =>
      timelineData.map((row, idx) => {
        const factor = Math.pow(1 + (settings.discountRate ?? 0) / 100, idx + 1)
        return {
          ...row,
          income: row.income / factor,
          expenses: row.expenses / factor,
          goals: row.goals / factor,
          loans: row.loans / factor,
          debtService: row.debtService / factor,
          net: row.net / factor,
          surplus: row.surplus / factor,
        }
      }),
    [timelineData, settings.discountRate]
  )

  const summaryRows = [
    { label: 'Income PV', value: incomePV },
    { label: 'Expenses PV', value: expensesPV },
    { label: 'Goals PV', value: pvGoals },
    { label: 'Liabilities PV', value: pvLiabilities },
    { label: 'Future Value', value: assetFutureValue },
    { label: 'Debt/Asset Ratio', value: debtAssetRatio },
    { label: 'Human Cap Share', value: humanCapitalShare },
    { label: 'Portfolio Return', value: assetReturn },
    { label: 'Portfolio Vol', value: assetVol },
  ]

  // --- Export JSON ---
  const exportJSON = () => {
    const exportPlan = {
      profile,
      assumptions: settings,
      timeline: timelineData,
      assets: assetsList,
      liabilities: liabilitiesList,
      PV: {
        income: incomePV,
        expenses: expensesPV,
        goals: pvGoals,
        liabilities: pvLiabilities,
        total: netWorth,
      },
    }
    const blob = new Blob([JSON.stringify(exportPlan, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const name = profile.name.replace(/\s+/g, '_');
    a.download = `balance-sheet-${name}.json`;
    a.click();
  };

  const exportCSV = () => {
    // For CSV export, we'll create a simplified version of the balance sheet
    const csvContent = [
      ['Metric', 'Value'],
      ['Total Assets', totalAssets],
      ['Total Liabilities', totalLiabilities],
      ['Net Worth', netWorth],
      ['Income PV', incomePV],
      ['Expenses PV', expensesPV],
      ['Goals PV', pvGoals],
      ['Liabilities PV', pvLiabilities],
      ['Future Value', assetFutureValue],
      ['Debt/Asset Ratio', debtAssetRatio],
      ['Human Capital Share', humanCapitalShare],
      ['Portfolio Return', assetReturn],
      ['Portfolio Volatility', assetVol],
    ].map(e => e.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const name = profile.name.replace(/\s+/g, '_');
    a.download = `balance-sheet-${name}.csv`;
    a.click();
  };

  const submitToAPI = () => {
    const payload = {
      profile,
      settings,
      assets: assetsList,
      liabilities: liabilitiesList,
      summary: {
        netWorth,
        debtAssetRatio,
        humanCapitalShare,
        portfolioReturn: assetReturn,
        portfolioVolatility: assetVol,
      },
    };
    submitProfile(payload, settings);
  };

  return (
    <div className="space-y-6 p-6">
      <h2 className="text-xl font-semibold text-amber-800">Lifetime Balance Sheet</h2>
      <a href="#adequacy-alert" className="text-sm underline text-amber-800 block">
        View Funding Gaps
      </a>

      <div className="mb-4 space-x-2">
        <label className="font-medium">Strategy:</label>
        <select
          className="border p-2 rounded-md"
          value={strategy}
          onChange={e => setStrategy(e.target.value)}
          aria-label="Strategy"
        >
          <option value="">-- Select --</option>
          {Object.keys(InvestmentStrategies).map(s => (
            <option key={s}>{s}</option>
          ))}
        </select>
        {strategy && (
          <span className="text-sm text-slate-700">
            {strategyReturn.toFixed(1)}% / {strategyVol.toFixed(1)}%
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-md font-medium mb-2">Assets</h3>
          <div className="grid grid-cols-4 gap-2 font-semibold text-gray-700 mb-1">
            <div></div>
            <div>Name</div>
            <div className="text-right">Amt</div>
            <div>Type</div>
          </div>
          {assetsList.map((item, i) => (
            <React.Fragment key={item.id}>
              <div
                className={`grid grid-cols-1 sm:grid-cols-4 gap-2 mb-1 items-center ${
                  item.id === 'pv-income'
                    ? 'italic bg-slate-100'
                    : 'border rounded-md p-2 sm:p-0'
                }`}
              >
                <button
                  onClick={() => toggleAsset(item.id)}
                  aria-expanded={expandedAssets[item.id] ? 'true' : 'false'}
                  className="text-amber-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  title="Toggle details"
                >
                  <span className="hidden sm:inline">{expandedAssets[item.id] ? '▾' : '▸'}</span>
                  <span className="sm:hidden text-sm underline">
                    {expandedAssets[item.id] ? 'Hide' : 'Details'}
                  </span>
                </button>
                <input
                  className="border p-2 rounded-md"
                  value={item.name}
                  onChange={e => updateItem(setAssetsList, assetsList, i, 'name', e.target.value)}
                  disabled={item.id === 'pv-income'}
                  aria-disabled={item.id === 'pv-income' ? 'true' : undefined}
                  aria-label="Asset name"
                  title="Asset name"
                />
                <input
                  type="number"
                  className="border p-2 rounded-md text-right"
                  value={item.amount}
                  onChange={e => updateItem(setAssetsList, assetsList, i, 'amount', e.target.value)}
                  disabled={item.id === 'pv-income'}
                  aria-disabled={item.id === 'pv-income' ? 'true' : undefined}
                  aria-label="Asset amount"
                  title="Asset amount"
                />
                <select
                  className="border p-2 rounded-md"
                  value={item.type}
                  onChange={e => updateItem(setAssetsList, assetsList, i, 'type', e.target.value)}
                  disabled={item.id === 'pv-income'}
                  aria-disabled={item.id === 'pv-income' ? 'true' : undefined}
                  aria-label="Asset type"
                  title="Asset type"
                >
                  <option value=""></option>
                  {Object.keys(LTCMA).map(t => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>
              {expandedAssets[item.id] && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2 ml-4 sm:ml-6 border-t pt-2 sm:border-none">
                  <input
                    type="number"
                    className="border p-2 rounded-md text-right"
                    value={item.expectedReturn}
                    onChange={e => updateItem(setAssetsList, assetsList, i, 'expectedReturn', e.target.value)}
                    aria-label="Expected return"
                    title="Expected return"
                  />
                  <input
                    type="number"
                    className="border p-2 rounded-md text-right"
                    value={item.volatility}
                    onChange={e => updateItem(setAssetsList, assetsList, i, 'volatility', e.target.value)}
                    aria-label="Volatility"
                    title="Volatility"
                  />
                  <input
                    type="number"
                    className="border p-2 rounded-md text-right"
                    value={item.horizonYears ?? ''}
                    onChange={e => updateItem(setAssetsList, assetsList, i, 'horizonYears', e.target.value)}
                    aria-label="Horizon years"
                    title="Horizon years"
                  />
                  <input
                    type="number"
                    className="border p-2 rounded-md text-right"
                    value={item.purchaseYear ?? ''}
                    onChange={e => updateItem(setAssetsList, assetsList, i, 'purchaseYear', e.target.value)}
                    aria-label="Purchase year"
                    title="Purchase year"
                  />
                  <input
                    type="number"
                    className="border p-2 rounded-md text-right"
                    value={item.saleYear ?? ''}
                    onChange={e => updateItem(setAssetsList, assetsList, i, 'saleYear', e.target.value)}
                    aria-label="Sale year"
                    title="Sale year"
                  />
                  <input
                    type="number"
                    className="border p-2 rounded-md text-right"
                    value={item.principal ?? ''}
                    onChange={e => updateItem(setAssetsList, assetsList, i, 'principal', e.target.value)}
                    aria-label="Principal"
                    title="Principal"
                  />
                </div>
              )}
            </React.Fragment>
          ))}
          <button
            onClick={addAsset}
            className="bg-amber-400 text-white px-4 py-2 rounded-md hover:bg-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
            aria-label="Add asset"
            title="Add asset"
          >
            + Add Asset
          </button>
        </div>

        <div>
          <h3 className="text-md font-medium mb-2">Liabilities</h3>
          {liabilitiesList.map((item, i) => (
            <React.Fragment key={item.id}>
              <div
                className={`grid grid-cols-1 sm:grid-cols-3 gap-2 mb-1 items-center ${
                  item.id === 'pv-expenses'
                    ? 'italic bg-slate-100'
                    : 'border rounded-md p-2 sm:p-0'
                }`}
              >
                <button
                  onClick={() => toggleLiability(item.id)}
                  aria-expanded={expandedLiabilities[item.id] ? 'true' : 'false'}
                  className="text-amber-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  title="Toggle details"
                >
                  <span className="hidden sm:inline">{expandedLiabilities[item.id] ? '▾' : '▸'}</span>
                  <span className="sm:hidden text-sm underline">
                    {expandedLiabilities[item.id] ? 'Hide' : 'Details'}
                  </span>
                </button>
                <input
                  className="border p-2 rounded-md"
                  value={item.name}
                  onChange={e => updateItem(setLiabilitiesList, liabilitiesList, i, 'name', e.target.value)}
                  disabled={item.id === 'pv-expenses'}
                  aria-disabled={item.id === 'pv-expenses' ? 'true' : undefined}
                  aria-label="Liability name"
                  title="Liability name"
                />
                <input
                  type="number"
                  className="border p-2 rounded-md"
                  value={item.principal ?? item.amount}
                  onChange={e => updateItem(setLiabilitiesList, liabilitiesList, i, 'principal', e.target.value)}
                  disabled={item.id === 'pv-expenses'}
                  aria-disabled={item.id === 'pv-expenses' ? 'true' : undefined}
                  aria-label="Principal"
                  title="Principal"
                />
              </div>
              {expandedLiabilities[item.id] && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2 ml-4 sm:ml-6 border-t pt-2 sm:border-none">
                  <input
                    type="number"
                    className="border p-2 rounded-md text-right"
                    value={item.interestRate ?? 0}
                    onChange={e => updateItem(setLiabilitiesList, liabilitiesList, i, 'interestRate', e.target.value)}
                    aria-label="Interest rate"
                    title="Interest rate"
                  />
                  <input
                    type="number"
                    className="border p-2 rounded-md text-right"
                    value={item.termYears ?? 1}
                    onChange={e => updateItem(setLiabilitiesList, liabilitiesList, i, 'termYears', e.target.value)}
                    aria-label="Term years"
                    title="Term years"
                  />
                  <input
                    type="number"
                    className="border p-2 rounded-md text-right"
                    value={item.paymentsPerYear ?? 12}
                    onChange={e => updateItem(setLiabilitiesList, liabilitiesList, i, 'paymentsPerYear', e.target.value)}
                    aria-label="Payments per year"
                    title="Payments per year"
                  />
                  <input
                    type="number"
                    className="border p-2 rounded-md text-right"
                    value={item.extraPayment ?? 0}
                    onChange={e => updateItem(setLiabilitiesList, liabilitiesList, i, 'extraPayment', e.target.value)}
                    aria-label="Extra payment"
                    title="Extra payment"
                  />
                </div>
              )}
            </React.Fragment>
          ))}
          <button
            onClick={addLiability}
            className="bg-amber-400 text-white px-4 py-2 rounded-md hover:bg-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
            aria-label="Add liability"
            title="Add liability"
          >
            + Add Liability
          </button>
        </div>
      </div>

      <div className="text-md text-slate-700 italic">
        Net Worth: <span className="text-2xl font-bold text-amber-800">{formatCurrency(netWorth, settings.locale, settings.currency)}</span>
        {debtAssetRatio > 0.5 && (
          <span className="block text-red-600 text-sm">Warning: Debt/Asset Ratio is high ({(debtAssetRatio * 100).toFixed(1)}%). Consider reducing debt.</span>
        )}
      </div>

      <table className="w-full text-sm mb-4">
        <tbody>
          {summaryRows.map(row => (
            <tr key={row.label} className="border-b last:border-none">
              <td className="py-1 pr-2 text-slate-700">{row.label}</td>
              <td className="py-1 text-right">
                {row.label === 'Debt/Asset Ratio'
                  ? `${(row.value * 100).toFixed(1)}%`
                  : typeof row.value === 'number'
                  ? formatCurrency(row.value, settings.locale, settings.currency)
                  : row.value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {loanStrategies.length > 0 && (
        <div className="mb-4">
          <h4 className="font-semibold text-slate-700 mb-2">Debt Optimization Tips</h4>
          <ul className="list-disc list-inside text-sm">
            {loanStrategies.map(s => (
              <li key={s.name}>
                {s.name}: save {formatCurrency(s.interestSaved, settings.locale, settings.currency)}
                {s.paymentsSaved ? `, ${s.paymentsSaved} fewer payments` : ''}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <div className="bg-white p-4 rounded-xl shadow-md">
          <h4 className="font-semibold text-slate-700 mb-2">Historical Net Worth</h4>
          <ResponsiveContainer width="100%" height={250} role="img" aria-label="Historical net worth chart">
            <LineChart data={historicalNetWorth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="netWorth" stroke="#8884d8" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-md">
          <h4 className="font-semibold text-slate-700 mb-2">Asset Allocation</h4>
          <ResponsiveContainer width="100%" height={250} role="img" aria-label="Asset allocation pie chart">
            <PieChart>
              <Pie data={assetPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {assetPieData.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-xl shadow-md">
          <h4 className="font-semibold text-slate-700 mb-2">Liability Allocation</h4>
          <ResponsiveContainer width="100%" height={250} role="img" aria-label="Liability allocation pie chart">
            <PieChart>
              <Pie data={liabilityPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {liabilityPieData.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-md">
          <h4 className="font-semibold text-slate-700 mb-2">Human vs Financial Capital</h4>
          <ResponsiveContainer width="100%" height={250} role="img" aria-label="Human versus financial capital chart">
            <BarChart data={humanVsFinancial}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#f59e0b" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-md">
        <h4 className="font-semibold text-slate-700 mb-2">Cashflow Projection</h4>
        <div className="mb-2 space-x-2">
          <button
            className={`px-3 py-1 rounded ${chartMode === 'nominal' ? 'bg-amber-400 text-white' : 'bg-white border border-amber-400 text-amber-700'}`}
            onClick={() => setChartMode('nominal')}
          >
            Nominal
          </button>
          <button
            className={`px-3 py-1 rounded ${chartMode === 'pv' ? 'bg-amber-400 text-white' : 'bg-white border border-amber-400 text-amber-700'}`}
            onClick={() => setChartMode('pv')}
          >
            Discounted
          </button>
        </div>
        <CashflowTimelineChart
          data={chartMode === 'pv' ? timelinePV : timelineData}
          locale={settings.locale}
          currency={settings.currency}
        />
        <div className="text-right mt-2">
        <button
          onClick={resetDefaults}
          className="border border-amber-600 px-4 py-1 rounded-md text-sm hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-500"
          aria-label="Reset balance sheet to defaults"
        >
          Reset Defaults
        </button>
        <button
          onClick={exportJSON}
          className="ml-2 border border-amber-600 px-4 py-1 rounded-md text-sm hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-500"
          aria-label="Export to JSON"
          title="Export to JSON"
        >
          📁 Export to JSON
        </button>
        <button
          onClick={exportCSV}
          className="ml-2 border border-amber-600 px-4 py-1 rounded-md text-sm hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-500"
          aria-label="Export to CSV"
          title="Export to CSV"
        >
          📊 Export to CSV
        </button>
        <button
          onClick={submitToAPI}
          className="ml-2 border border-amber-600 px-4 py-1 rounded-md text-sm hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-500"
          aria-label="Submit plan to API"
          title="Submit plan to API"
        >
          🚀 Submit to API
        </button>
        <button
          onClick={() => window.print()}
          className="ml-2 border border-amber-600 px-4 py-1 rounded-md text-sm hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-500"
          aria-label="Print report"
          title="Print report"
        >
          🖨️ Print
        </button>
      </div>
      </div>
    </div>
  )
}