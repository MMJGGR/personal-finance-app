// src/IncomeTab.jsx
/**
 * IncomeTab
 * — Allows users to define multiple income streams,
 *    set projection assumptions, calculate present value,
 *    and visualize annual projections.
 *
 * Inputs (context): incomeSources, startYear, discountRate, years, monthlyExpense, settings
 * Outputs (context): incomePV (updated each render)
 */

import React, { useMemo, useEffect } from 'react';
import { useFinance } from '../../FinanceContext';
import { buildIncomeJSON, buildIncomeCSV, submitProfile } from '../../utils/exportHelpers'
import { calculatePV, findLinkedAsset } from './helpers';
import { generateIncomeTimeline } from '../../utils/cashflowTimeline';
import calcDiscretionaryAdvice from '../../utils/discretionaryUtils';
import IncomeSourceRow from './IncomeSourceRow'
import IncomeTimelineChart from './IncomeTimelineChart'

import { formatCurrency } from '../../utils/formatters'
import storage from '../../utils/storage'
import { appendAuditLog } from '../../utils/auditLog'
import sanitize from '../../utils/sanitize'


export default function IncomeTab() {
  const {
    incomeSources, setIncomeSources,
    monthlyExpense,
    monthlySurplusNominal,
    profile,
    settings,
    expensesList,
    assetsList,
    setIncomePV,
  } = useFinance();


  const currentYear = new Date().getFullYear();
  const startYear = settings.startYear ?? currentYear;
  const discountRate = settings.discountRate ?? 0;

  const assumptions = useMemo(
    () => ({
      retirementAge: currentYear + (settings.retirementAge - profile.age),
      deathAge: currentYear + (profile.lifeExpectancy - profile.age),
    }),
    [currentYear, settings.retirementAge, profile.lifeExpectancy, profile.age]
  )

  const years = assumptions.deathAge - currentYear

  // 1. Compute PV per stream & total
  const pvResults = useMemo(
    () =>
      incomeSources.map(s =>
        s.active
          ? calculatePV(
              s,
              discountRate,
              years,
              assumptions,
              findLinkedAsset(s.linkedAssetId, assetsList)
            )
          : { gross: 0, net: 0 }
      ),
    [incomeSources, discountRate, years, assumptions, assetsList]
  )

  const totalGrossPV = useMemo(
    () => pvResults.reduce((sum, p) => sum + p.gross, 0),
    [pvResults]
  )
  const totalNetPV = useMemo(
    () => pvResults.reduce((sum, p) => sum + p.net, 0),
    [pvResults]
  )


  const timelineData = useMemo(
    () =>
      generateIncomeTimeline(
        incomeSources,
        { ...assumptions, annualExpenses: monthlyExpense * 12 },
        assetsList,
        years
      ),
    [incomeSources, assumptions, assetsList, years, monthlyExpense]
  )

  const gaps = useMemo(
    () => timelineData.filter(t => t.net < monthlyExpense * 12),
    [timelineData, monthlyExpense]
  )

  const liquidAssets = useMemo(
    () =>
      assetsList.reduce(
        (sum, a) =>
          a.liquid || a.type === 'Cash' || a.type === 'Savings'
            ? sum + Number(a.amount || 0)
            : sum,
        0
      ),
    [assetsList]
  )

  const liquidityCoverage = useMemo(
    () => (monthlyExpense > 0 ? liquidAssets / monthlyExpense : Infinity),
    [liquidAssets, monthlyExpense]
  )



  const stabilityScore = useMemo(() => {
    const total = incomeSources.reduce(
      (sum, s) => (s.active === false ? sum : sum + s.amount * s.frequency),
      0
    )
    if (total === 0) return 0
    const weighted = incomeSources.reduce((sum, s) => {
      if (s.active === false) return sum
      const weight = s.type === 'Salary' ? 1 : s.type === 'Freelance' ? 0.6 : 0.3
      return sum + weight * s.amount * s.frequency
    }, 0)
    return weighted / total
  }, [incomeSources])

  const discretionaryAdvice = useMemo(
    () =>
      calcDiscretionaryAdvice(
        expensesList,
        monthlyExpense,
        monthlySurplusNominal,
        settings.discretionaryCutThreshold || 0
      ),
    [expensesList, monthlyExpense, monthlySurplusNominal, settings]
  );

  // 2. Compute interruption months with optional obligations (removed)

  // 3. Build projection data for chart

  // 4. Sync PV back into context & localStorage
  useEffect(() => {
    setIncomePV(totalGrossPV);
    storage.set('incomePV', totalGrossPV.toString());
  }, [totalGrossPV, setIncomePV]);


  // --- Handlers for form inputs ---
  const onFieldChange = (idx, field, raw) => {
    const value = typeof raw === 'string' ? sanitize(raw) : raw
    const oldValue = incomeSources[idx]?.[field]
    const updated = incomeSources.map((src, i) => {
      if (i !== idx) return src
      if (field === 'name' || field === 'type') {
        return { ...src, [field]: value }
      }
      if (field === 'linkedAssetId') {
        return { ...src, linkedAssetId: value }
      }
      if (field === 'active') {
        return { ...src, active: value }
      }
      if (field === 'startYear' || field === 'endYear') {
        const yr = Number(raw)
        let val = isNaN(yr) ? null : yr
        const other = field === 'startYear' ? src.endYear : src.startYear
        if (val != null && other != null) {
          if (field === 'startYear' && val > other) val = other
          if (field === 'endYear' && other > val) val = other
        }
        return { ...src, [field]: val }
      }
      const num = parseFloat(raw)
      if (field === 'frequency') {
        return { ...src, [field]: isNaN(num) ? 1 : Math.max(1, num) }
      }
      return { ...src, [field]: isNaN(num) ? 0 : Math.max(0, num) }
    })
    setIncomeSources(updated)
    appendAuditLog(storage, {
      field: `income.${field}`,
      oldValue,
      newValue: updated[idx]?.[field],
    })
  }

  const addIncome = () => {
    setIncomeSources([
      ...incomeSources,
      {
        id: crypto.randomUUID(),
        name: '',
        type: 'Other',
        amount: 0,
        frequency: 1,
        growth: 0,
        taxRate: 0,
        startYear: startYear,
        endYear: null,
        linkedAssetId: '',
        active: true,
      },
    ]);
  };

  const removeIncome = (idx) => {
    setIncomeSources(incomeSources.filter((_, i) => i !== idx));
  };

  const updateIncome = onFieldChange;
  const deleteIncome = removeIncome;

  // --- Export JSON payload ---
  const exportJSON = () => {
    const payload = buildIncomeJSON(
      profile,
      startYear,
      incomeSources,
      discountRate,
      years,
      monthlyExpense,
      pvResults,
      totalGrossPV,
      timelineData
    )
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const name = profile.name.replace(/\s+/g, '_');
    a.download = `income-data-${name}.json`;
    a.click();
  };

  const exportCSV = () => {
    const columns = ['Period', ...incomeSources.map((src, i) => src.name || `Source ${i + 1}`)]
    const rows = Array.from({ length: years }, (_, idx) => {
      const year = startYear + idx
      const cells = [year]
      incomeSources.forEach(src => {
        const isSalary = String(src.type).toLowerCase() === 'salary'
        const retireLimit = startYear + (settings.retirementAge - profile.age) - 1
        const end = src.endYear ?? (isSalary ? Math.min(startYear + years - 1, retireLimit) : startYear + years - 1)
        if (year < (src.startYear ?? startYear) || year > end) {
          cells.push(0)
        } else {
          const yearIdx = year - (src.startYear ?? startYear)
          const amt = src.amount * src.frequency * Math.pow(1 + src.growth / 100, yearIdx)
          cells.push(Number(amt.toFixed(2)))
        }
      })
      return cells
    })
    const csv = buildIncomeCSV(profile, columns, rows)
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const name = profile.name.replace(/\s+/g, '_');
    a.download = `income-data-${name}.csv`;
    a.click();
  };

  const submitToAPI = () => {
    const payload = buildIncomeJSON(
      profile,
      startYear,
      incomeSources,
      discountRate,
      years,
      monthlyExpense,
      pvResults,
      totalGrossPV,
      timelineData
    )
    submitProfile(payload, settings)
  };

  const triggerPrint = () => window.print();



  // --- Render ---
  return (
    <div className="space-y-8">
      {/* Income Streams Form */}
      <section>
        <h2 className="text-xl font-bold text-amber-800 mb-4">Income Sources</h2>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {incomeSources.length === 0 && (
            <p className="italic text-slate-500 col-span-full text-center">No income sources yet</p>
          )}
          {incomeSources.map((src, i) => (
            <IncomeSourceRow
              key={i}
              income={src}
              index={i}
              updateIncome={updateIncome}
              deleteIncome={deleteIncome}
              currency={settings.currency}
              assetsList={assetsList}
            />
          ))}
        </div>
        <button
          onClick={addIncome}
          className="mt-4 bg-amber-400 hover:bg-amber-300 text-white px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
          aria-label="Add income source"
          title="Add income source"
        >
          ➕ Add Income
        </button>
      </section>



      {/* PV Summary */}
      <section className="bg-white p-4 rounded-xl shadow-md">
        <h2 className="text-lg font-bold text-amber-800 mb-2">💰 Present Value Summary</h2>
        <ul className="text-sm space-y-1">
          {incomeSources.map((src, i) => (
            <li key={i}>
              {src.name || `Source ${i + 1}`}:&nbsp;
              <span className="text-amber-800 font-semibold">
                {formatCurrency(pvResults[i].gross, settings.locale, settings.currency)}
              </span>{' '}
              <span className="text-green-600 font-semibold">
                (after tax {formatCurrency(pvResults[i].net, settings.locale, settings.currency)})
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-4 font-semibold">
          Total PV (Gross):&nbsp;
          <span className="text-amber-800 text-xl">
            {formatCurrency(totalGrossPV, settings.locale, settings.currency)}
          </span>
        </p>
        <p className="font-semibold">
          Total PV (After Tax):&nbsp;
          <span className="text-green-600 text-xl">
            {formatCurrency(totalNetPV, settings.locale, settings.currency)}
          </span>
          <span className="ml-2 px-2 rounded bg-green-200 text-green-800">Stability: {(stabilityScore * 100).toFixed(0)}%</span>
        </p>
        <p className="text-sm mt-2">
          Liquidity Coverage: <span className={`${liquidityCoverage < 6 ? 'text-red-500' : liquidityCoverage < 12 ? 'text-yellow-500' : 'text-green-600'}`}>{liquidityCoverage.toFixed(1)} months</span>
        </p>
      </section>

      {discretionaryAdvice.length > 0 && (
        <div className="bg-white rounded-xl shadow p-4">
          <h3 className="text-lg font-bold text-amber-800 mb-2">Spending Advice</h3>
          <p className="text-sm mb-1">Consider trimming these expenses:</p>
          <ul className="list-disc pl-5 text-sm space-y-1">
            {discretionaryAdvice.map((d, i) => (
              <li key={i}>
                Cut <strong>{d.name}</strong> (~
                {formatCurrency(d.amount, settings.locale, settings.currency)}
                /mo)
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Projection Chart */}
      <IncomeTimelineChart
        data={timelineData}
        locale={settings.locale}
        currency={settings.currency}
      />

      {gaps.length > 0 && (
        <p className="text-red-600 font-bold mt-2">Warning: Income shortfall in {gaps[0].year} to {gaps[gaps.length - 1].year}</p>
      )}

      {/* Export */}
      <section>
        <button
          onClick={exportJSON}
          className="bg-white border border-amber-600 text-amber-800 px-4 py-2 rounded-md hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-500"
          aria-label="Export income to JSON"
          title="Export income to JSON"
        >
          📁 Export Income to JSON
        </button>
        <button
          onClick={exportCSV}
          className="ml-2 bg-white border border-amber-600 text-amber-800 px-4 py-2 rounded-md hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-500"
          aria-label="Export CSV"
          title="Export CSV"
        >
          📊 Export CSV
        </button>
        <button
          onClick={submitToAPI}
          className="ml-2 bg-white border border-amber-600 text-amber-800 px-4 py-2 rounded-md hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-500"
          aria-label="Submit income to API"
          title="Submit income to API"
        >
          🚀 Submit to API
        </button>
        <button
          onClick={triggerPrint}
          className="ml-2 bg-white border border-amber-600 text-amber-800 px-4 py-2 rounded-md hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-500"
          aria-label="Print"
          title="Print"
        >
          🖨️ Print
        </button>
      </section>
    </div>
  );
}
