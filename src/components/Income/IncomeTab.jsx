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

import React, { useMemo, useEffect, useState } from 'react';
import { useFinance } from '../../FinanceContext';
import { buildIncomeJSON, buildIncomeCSV, submitProfile } from '../../utils/exportHelpers'
import {
  calculateNominalSurvival,
  calculatePVSurvival,
  calculatePVObligationSurvival
} from '../../utils/survivalMetrics';
import calcDiscretionaryAdvice from '../../utils/discretionaryUtils';
import generateLoanAdvice from '../../utils/loanAdvisoryEngine'
import suggestLoanStrategies from '../../utils/suggestLoanStrategies'
import AdviceDashboard from '../../AdviceDashboard'
import AdequacyAlert from '../../AdequacyAlert'
import IncomeSourceRow from './IncomeSourceRow'
import IncomeTimelineChart from './IncomeTimelineChart'
import { getIncomeProjection } from '../../utils/incomeProjection'
import { frequencyToPayments } from '../../utils/financeUtils'
import { formatCurrency } from '../../utils/formatters'
import storage from '../../utils/storage'


export default function IncomeTab() {
  const {
    incomeSources, setIncomeSources,
    monthlyExpense,
    monthlyPVHigh,
    monthlyPVMedium,
    monthlyPVLow,
    includeMediumPV,
    includeLowPV,
    includeGoalsPV,
    includeLiabilitiesNPV,
    monthlySurplusNominal,
    monthlyIncomeNominal,
    profile,
    settings,
    expensesList,
    goalsList,
    liabilitiesList,
    assetsList,
    setIncomePV,
  } = useFinance();

  const [excludedForInterrupt] = useState([]);

  const startYear = settings.startYear ?? new Date().getFullYear();
  const discountRate = settings.discountRate ?? 0;
  const years = settings.projectionYears ?? 1;

  const assumptions = useMemo(() => {
    const nowYear = new Date().getFullYear()
    return {
      retirementAge: nowYear + (settings.retirementAge - profile.age),
      deathAge: nowYear + (profile.lifeExpectancy - profile.age),
    }
  }, [settings.retirementAge, profile.lifeExpectancy, profile.age])

  const currentYear = new Date().getFullYear();
  const pvGoals = useMemo(
    () =>
      goalsList.reduce((sum, g) => {
        const yrs = Math.max(0, g.targetYear - currentYear);
        return sum + g.amount / Math.pow(1 + discountRate / 100, yrs);
      }, 0),
    [goalsList, discountRate, currentYear]
  );

  const pvLiabilities = useMemo(
    () =>
      liabilitiesList.reduce((sum, l) => {
        const n = l.termYears * l.paymentsPerYear;
        const i = (l.interestRate / 100) / l.paymentsPerYear;
        if (n === 0) return sum;
        const payment = i === 0 ? l.principal / n : (i * l.principal) / (1 - Math.pow(1 + i, -n));
        const pv = i === 0 ? l.principal : payment * (1 - Math.pow(1 + i, -n)) / i;
        return sum + pv;
      }, 0),
    [liabilitiesList]
  );

  // 1. Compute PV per stream & total
  const pvPerStream = useMemo(
    () =>
      incomeSources.map(src => {
        if (src.active === false) return 0
        const linked = assetsList.find(a => a.id === src.linkedAssetId)
        const projection = getIncomeProjection(src, assumptions, linked)
        const planEnd = startYear + years - 1
        return projection.reduce((sum, p) => {
          if (p.year < startYear || p.year > planEnd) return sum
          const t = p.year - startYear
          return sum + p.amount / Math.pow(1 + discountRate / 100, t)
        }, 0)
      }),
    [incomeSources, assetsList, assumptions, discountRate, startYear, years]
  )
  const totalPV = useMemo(() => pvPerStream.reduce((a, b) => a + b, 0), [pvPerStream])
  const totalIncomePV = totalPV

  const pieData = useMemo(
    () =>
      incomeSources.map((src, i) => ({
        name: src.name || `Source ${i + 1}`,
        value: pvPerStream[i] || 0,
      })),
    [incomeSources, pvPerStream]
  )

  const timelineData = useMemo(() => {
    const now = new Date().getFullYear()
    const lastYear = assumptions.deathAge
    const len = lastYear - now + 1
    const rows = Array.from({ length: len }, (_, i) => ({ year: now + i, expenses: 0 }))

    const activeStreams = incomeSources.filter(s => s.active)

    activeStreams.forEach(src => {
      const linked = assetsList.find(a => a.id === src.linkedAssetId)
      const proj = getIncomeProjection(src, assumptions, linked)
      proj.forEach(p => {
        const row = rows[p.year - now]
        if (row) row[src.id] = (row[src.id] || 0) + p.amount
      })
    })

    rows.forEach((row, idx) => {
      const year = row.year
      const expTotal = expensesList.reduce((sum, e) => {
        const ppy = e.paymentsPerYear || frequencyToPayments(e.frequency) || 1
        const growth = e.growth || 0
        const base = (Number(e.amount) || 0) * ppy
        return sum + base * Math.pow(1 + growth / 100, idx)
      }, 0)
      const goalsTotal = goalsList.reduce(
        (s, g) => s + (g.targetYear === year ? Number(g.amount) || 0 : 0),
        0
      )
      row.expenses = expTotal + goalsTotal
      activeStreams.forEach(s => {
        if (row[s.id] == null) row[s.id] = 0
      })
    })

    return rows
  }, [incomeSources, assetsList, assumptions, expensesList, goalsList])

  const loanAdvice = useMemo(
    () =>
      generateLoanAdvice(
        liabilitiesList,
        { ...profile, totalPV: totalIncomePV },
        monthlyIncomeNominal,
        monthlyExpense,
        discountRate,
        years
      ),
    [liabilitiesList, profile, totalIncomePV, monthlyIncomeNominal, monthlyExpense, discountRate, years]
  );

  const loanStrategies = useMemo(
    () => suggestLoanStrategies(liabilitiesList),
    [liabilitiesList]
  );

  const nominalSurvivalMonths = useMemo(
    () =>
      calculateNominalSurvival(
        totalIncomePV,
        discountRate,
        years,
        monthlyExpense
      ),
    [totalIncomePV, discountRate, years, monthlyExpense]
  )

  const pvSurvivalMonths = useMemo(
    () =>
      calculatePVSurvival(
        totalIncomePV,
        discountRate,
        monthlyExpense,
        years
      ),
    [totalIncomePV, discountRate, monthlyExpense, years]
  )

  const simpleSurvivalMonths = useMemo(
    () => (monthlyExpense > 0 ? Math.floor(totalIncomePV / monthlyExpense) : Infinity),
    [totalIncomePV, monthlyExpense]
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

  const interruptionPV = useMemo(
    () =>
      pvPerStream.reduce(
        (sum, pv, idx) =>
          excludedForInterrupt.includes(idx) ? sum : sum + pv,
        0
      ),
    [pvPerStream, excludedForInterrupt]
  );

  // 2. Compute interruption months with optional obligations
  const monthlyObligations = useMemo(() => {
    const expPart =
      monthlyPVHigh +
      (includeMediumPV ? monthlyPVMedium : 0) +
      (includeLowPV ? monthlyPVLow : 0);
    const goalsPart = includeGoalsPV && years > 0 ? pvGoals / (years * 12) : 0;
    const liabPart = includeLiabilitiesNPV && years > 0 ? pvLiabilities / (years * 12) : 0;
    return expPart + goalsPart + liabPart;
  }, [includeMediumPV, includeLowPV, includeGoalsPV, includeLiabilitiesNPV, pvGoals, pvLiabilities, monthlyPVHigh, monthlyPVMedium, monthlyPVLow, years]);

  const _interruptionMonths = useMemo(
    () =>
      monthlyObligations > 0
        ? Math.floor(interruptionPV / monthlyObligations)
        : Infinity,
    [interruptionPV, monthlyObligations]
  );

  const pvObligationSurvivalMonths = useMemo(
    () =>
      calculatePVObligationSurvival(
        totalIncomePV,
        discountRate,
        monthlyObligations
      ),
    [totalIncomePV, discountRate, monthlyObligations]
  )

  // 3. Sync totalPV back into context & localStorage
  useEffect(() => {
    setIncomePV(totalPV);
    storage.set('incomePV', totalPV.toString());
  }, [totalPV, setIncomePV]);


  // --- Handlers for form inputs ---
  const onFieldChange = (idx, field, raw) => {
    const updated = incomeSources.map((src, i) => {
      if (i !== idx) return src
      if (field === 'name' || field === 'type') {
        return { ...src, [field]: raw }
      }
      if (field === 'linkedAssetId') {
        return { ...src, linkedAssetId: raw }
      }
      if (field === 'active') {
        return { ...src, active: raw }
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
      pvPerStream,
      totalPV,
      timelineData
    )
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'income-data.json';
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
    a.download = 'income-data.csv';
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
      pvPerStream,
      totalPV,
      timelineData
    )
    submitProfile(payload, settings)
  };

  const triggerPrint = () => window.print();



  // --- Render ---
  return (
    <div className="space-y-8">
      <AdviceDashboard
        advice={loanAdvice}
        discretionaryAdvice={discretionaryAdvice}
        loanStrategies={loanStrategies}
      />
      {/* Income Streams Form */}
      <section>
        <h2 className="text-xl font-bold text-amber-700 mb-4">Income Sources</h2>
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
        <h2 className="text-lg font-bold text-amber-700 mb-2">💰 Present Value Summary</h2>
        <ul className="text-sm space-y-1">
          {incomeSources.map((src, i) => (
            <li key={i}>
              {src.name || `Source ${i+1}`}:&nbsp;
              <span className="text-green-600 font-semibold">
                {formatCurrency(pvPerStream[i], settings.locale, settings.currency)}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-4 font-semibold">
          Total PV:&nbsp;
          <span className="text-green-600 text-xl">
            {formatCurrency(totalPV, settings.locale, settings.currency)}
          </span>
        </p>
        <p className="text-sm mt-2" title="Months covered ignoring discounting">
          Nominal Survival:&nbsp;
          <strong>{nominalSurvivalMonths === Infinity ? '∞' : nominalSurvivalMonths}</strong>
          {nominalSurvivalMonths === Infinity ? '' : '\u00A0months'}
          {nominalSurvivalMonths === Infinity && ' (No expenses)'}
        </p>
        <p className="text-sm" title="Months covered when discounting each month">
          PV Survival:&nbsp;
          <strong>{pvSurvivalMonths === Infinity ? '∞' : pvSurvivalMonths}</strong>
          {pvSurvivalMonths === Infinity ? '' : '\u00A0months'}
          {pvSurvivalMonths === Infinity && ' (No expenses)'}
        </p>
        <p className="text-sm" title="Months with PV obligations included">
          PV Survival (Obligations):&nbsp;
          <strong>
            {pvObligationSurvivalMonths === Infinity ? '∞' : pvObligationSurvivalMonths}
          </strong>
          {pvObligationSurvivalMonths === Infinity ? '' : '\u00A0months'}
          {pvObligationSurvivalMonths === Infinity && ' (No obligations)'}
        </p>
        <p className="text-sm" title="Months remaining income covers obligations">
          Interruption Months:&nbsp;
          <strong>{_interruptionMonths === Infinity ? '∞' : _interruptionMonths}</strong>
          {_interruptionMonths === Infinity ? '' : '\u00A0months'}
          {_interruptionMonths === Infinity && ' (No obligations)'}
        </p>
        <p className="text-sm" title="Weighted by income type">
          Stability: <strong>{(stabilityScore * 100).toFixed(0)}%</strong>
        </p>
        {(() => {
          const survivalColor =
            simpleSurvivalMonths < 6
              ? 'bg-red-500'
              : simpleSurvivalMonths < 12
              ? 'bg-yellow-400'
              : 'bg-green-500';
          return (
            <span className={`mt-2 inline-block px-2 py-1 rounded text-white ${survivalColor}`}> {simpleSurvivalMonths === Infinity ? '∞' : simpleSurvivalMonths} months</span>
          );
        })()}
      </section>

      {discretionaryAdvice.length > 0 && (
        <div className="bg-white rounded-xl shadow p-4">
          <h3 className="text-lg font-bold text-amber-700 mb-2">Spending Advice</h3>
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
        incomeSources={incomeSources}
        locale={settings.locale}
        currency={settings.currency}
      />

      <AdequacyAlert />
      {stabilityScore < 0.6 && pvSurvivalMonths < 6 && (
        <AdequacyAlert message="Consider income protection or a larger emergency fund." />
      )}

      {/* Export */}
      <section>
        <button
          onClick={exportJSON}
          className="bg-white border border-amber-600 text-amber-700 px-4 py-2 rounded-md hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-500"
          aria-label="Export income to JSON"
          title="Export income to JSON"
        >
          📁 Export Income to JSON
        </button>
        <button
          onClick={exportCSV}
          className="ml-2 bg-white border border-amber-600 text-amber-700 px-4 py-2 rounded-md hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-500"
          aria-label="Export CSV"
          title="Export CSV"
        >
          📊 Export CSV
        </button>
        <button
          onClick={submitToAPI}
          className="ml-2 bg-white border border-amber-600 text-amber-700 px-4 py-2 rounded-md hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-500"
          aria-label="Submit income to API"
          title="Submit income to API"
        >
          🚀 Submit to API
        </button>
        <button
          onClick={triggerPrint}
          className="ml-2 bg-white border border-amber-600 text-amber-700 px-4 py-2 rounded-md hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-500"
          aria-label="Print"
          title="Print"
        >
          🖨️ Print
        </button>
      </section>
    </div>
  );
}
