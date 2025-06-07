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
import { useFinance } from './FinanceContext';
import { calculatePV } from './utils/financeUtils';
import { buildIncomeJSON, buildIncomeCSV, submitProfile } from './utils/exportHelpers'
import {
  calculateNominalSurvival,
  calculatePVSurvival,
  calculatePVObligationSurvival
} from './utils/survivalMetrics';
import calcDiscretionaryAdvice from './utils/discretionaryUtils';
import generateLoanAdvice from './utils/loanAdvisoryEngine'
import suggestLoanStrategies from './utils/suggestLoanStrategies'
import AdviceDashboard from './AdviceDashboard'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { formatCurrency } from './utils/formatters'

export default function IncomeTab() {
  const {
    incomeSources, setIncomeSources,
    startYear, setStartYear,
    discountRate, setDiscountRate,
    years, setYears,
    monthlyExpense,
    monthlyPVExpense,
    monthlyPVHigh,
    monthlyPVMedium,
    monthlyPVLow,
    includeMediumPV,
    setIncludeMediumPV,
    includeLowPV,
    setIncludeLowPV,
    includeGoalsPV,
    setIncludeGoalsPV,
    includeLiabilitiesNPV,
    setIncludeLiabilitiesNPV,
    monthlySurplusNominal,
    monthlyIncomeNominal,
    profile,
    settings,
    expensesList,
    goalsList,
    liabilitiesList,
    setIncomePV,
  } = useFinance();

  const [chartView, setChartView] = useState('yearly');
  const [excludedForInterrupt, setExcludedForInterrupt] = useState([]);

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
        const afterTaxAmt = src.amount * (1 - (src.taxRate || 0) / 100);
        return calculatePV(
          afterTaxAmt,
          src.frequency,
          src.growth,
          discountRate,
          years
        );
      }),
    [incomeSources, discountRate, years]
  );
  const totalPV = useMemo(() => pvPerStream.reduce((a, b) => a + b, 0), [pvPerStream])
  const totalIncomePV = totalPV

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

  // 3. Build projection data for chart
  const incomeData = useMemo(() => {
    if (chartView === 'monthly') {
      return Array.from({ length: years * 12 }, (_, idx) => {
        const yrIndex = Math.floor(idx / 12);
        const month = (idx % 12) + 1;
        const entry = {
          year: `${startYear + yrIndex}-${String(month).padStart(2, '0')}`,
        };
        incomeSources.forEach((src, sIdx) => {
          const annual =
            src.amount *
            src.frequency *
            Math.pow(1 + src.growth / 100, yrIndex);
          entry[src.name || `Source ${sIdx + 1}`] = Number(
            (annual / 12).toFixed(2)
          );
        });
        return entry;
      });
    }
    return Array.from({ length: years }, (_, i) => {
      const year = startYear + i;
      const entry = { year: `${year}` };
      incomeSources.forEach((src, sIdx) => {
        entry[src.name || `Source ${sIdx + 1}`] = Number(
          (
            src.amount *
            src.frequency *
            Math.pow(1 + src.growth / 100, i)
          ).toFixed(2)
        );
      });
      return entry;
    });
  }, [incomeSources, startYear, years, chartView]);

  // 4. Sync totalPV back into context & localStorage
  useEffect(() => {
    setIncomePV(totalPV);
    localStorage.setItem('incomePV', totalPV.toString());
  }, [totalPV, setIncomePV]);


  // --- Handlers for form inputs ---
  const onFieldChange = (idx, field, raw) => {
    const updated = incomeSources.map((src, i) => {
      if (i !== idx) return src;
      if (field === 'name' || field === 'type') {
        return { ...src, [field]: raw };
      }
      const num = parseFloat(raw);
      if (field === 'frequency') {
        return { ...src, [field]: isNaN(num) ? 1 : Math.max(1, num) };
      }
      return { ...src, [field]: isNaN(num) ? 0 : Math.max(0, num) };
    });
    setIncomeSources(updated);
  };

  const addIncome = () => {
    setIncomeSources([
      ...incomeSources,
      {
        name: '',
        type: 'Other',
        amount: 0,
        frequency: 1,
        growth: 0,
        taxRate: 0,
      },
    ]);
  };

  const removeIncome = (idx) => {
    setIncomeSources(incomeSources.filter((_, i) => i !== idx));
  };

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
      totalPV
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
    const rows = incomeData.map(row =>
      columns.map(col => (col === 'Period' ? row.year : row[col]))
    )
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
      totalPV
    )
    submitProfile(payload, settings)
  };

  const triggerPrint = () => window.print();

  // Chart palette (aligned with warm amber theme)
  const chartColors = [
    '#FBBF24','#F59E0B','#FDBA74','#FB923C',
    '#F472B6','#C084FC','#34D399','#60A5FA',
  ];

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
            <div
              key={i}
              className="bg-white p-4 rounded-xl shadow-md relative transition-all"
            >
              <label className="block text-sm font-medium">Source Name</label>
              <input
                type="text"
                className="w-full border p-2 rounded-md invalid:border-red-500"
                value={src.name}
                onChange={e => onFieldChange(i, 'name', e.target.value)}
                required
                title="Source name"
              />

              <label className="block text-sm font-medium mt-2">Type</label>
              <select
                className="w-full border p-2 rounded-md"
                value={src.type}
                onChange={e => onFieldChange(i, 'type', e.target.value)}
                aria-label="Income type"
                title="Income type"
              >
                <option>Employment</option>
                <option>Business</option>
                <option>Rental</option>
                <option>Investment</option>
                <option>Other</option>
              </select>

              <label className="block text-sm font-medium mt-2">Amount ({settings.currency})</label>
              <input
                type="number"
                className="w-full border p-2 rounded-md invalid:border-red-500"
                value={src.amount}
                onChange={e => onFieldChange(i, 'amount', e.target.value)}
                min={0}
                step={0.01}
                required
                title="Amount per payment"
              />

              <label className="block text-sm font-medium mt-2">Frequency (/yr)</label>
              <input
                type="number"
                className="w-full border p-2 rounded-md invalid:border-red-500"
                value={src.frequency}
                onChange={e => onFieldChange(i, 'frequency', e.target.value)}
                min={1}
                step={1}
                required
                title="Payments per year"
              />

              <label className="block text-sm font-medium mt-2">Growth Rate (%)</label>
              <input
                type="number"
                className="w-full border p-2 rounded-md invalid:border-red-500"
                value={src.growth}
                onChange={e => onFieldChange(i, 'growth', e.target.value)}
                step={0.1}
                min={-100}
                max={100}
                title="Annual growth rate"
              />

              <label className="block text-sm font-medium mt-2">Tax Rate (%)</label>
              <input
                type="number"
                className="w-full border p-2 rounded-md invalid:border-red-500"
                value={src.taxRate}
                onChange={e => onFieldChange(i, 'taxRate', e.target.value)}
                min={0}
                max={100}
                step={0.1}
                required
                title="Income tax rate"
              />

              <button
                onClick={() => removeIncome(i)}
                className="absolute top-2 right-2 text-red-600 hover:text-red-800 focus:outline-none focus:ring-2 focus:ring-red-500"
                aria-label="Remove income source"
              >✖</button>
            </div>
          ))}
        </div>
        <button
          onClick={addIncome}
          className="mt-4 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
          aria-label="Add income source"
          title="Add income source"
        >
          ➕ Add Income
        </button>
      </section>


      {/* Assumptions */}
      <section className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        <div className="bg-white p-4 rounded-xl shadow-md">
          <label className="block text-sm font-medium">Start Year</label>
          <input
            type="number"
            className="w-full border p-2 rounded-md"
            value={startYear}
            onChange={e => setStartYear(+e.target.value)}
            min={1900} max={2100}
            title="Start year"
          />

          <label className="block text-sm font-medium mt-4">Discount Rate (%)</label>
          <input
            type="number"
            className="w-full border p-2 rounded-md"
            value={discountRate}
            onChange={e => setDiscountRate(+e.target.value)}
            min={0} max={100} step={0.1}
            title="Discount rate"
          />

          <label className="block text-sm font-medium mt-4">Projection Years</label>
          <input
            type="number"
            className="w-full border p-2 rounded-md"
            value={years}
            onChange={e => setYears(+e.target.value)}
            min={1}
            title="Projection years"
          />

          <label className="block text-sm font-medium mt-4">Chart View</label>
          <select
            className="w-full border p-2 rounded-md"
            value={chartView}
            onChange={e => setChartView(e.target.value)}
            aria-label="Chart view"
          >
            <option value="yearly">Yearly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-md">
          <p className="text-sm italic text-slate-500">
            Monthly Expenses (from Expenses tab):
            <span className="font-semibold text-amber-700">
              {' '}
              {formatCurrency(monthlyExpense, settings.locale, settings.currency)}
            </span>
          </p>
          <p className="text-sm italic text-slate-500 mt-1">
            PV-Adjusted Monthly Expense:&nbsp;
            <span className="font-semibold text-amber-700">
              {formatCurrency(monthlyPVExpense, settings.locale, settings.currency)}
            </span>
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-md">
          <label className="block text-sm font-medium mb-2">Include in Expenses</label>
          <label className="flex items-center">
            <input
              type="checkbox"
              className="mr-2"
              checked={includeGoalsPV}
              onChange={e => setIncludeGoalsPV(e.target.checked)}
              aria-label="Include goals present value"
            />
            Include Goals (PV)
          </label>
          <label className="flex items-center mt-1">
            <input
              type="checkbox"
              className="mr-2"
              checked={includeLiabilitiesNPV}
              onChange={e => setIncludeLiabilitiesNPV(e.target.checked)}
              aria-label="Include liabilities NPV"
            />
            Include Liabilities (NPV)
          </label>
          <label className="flex items-center mt-1">
            <input
              type="checkbox"
              className="mr-2"
              checked={includeMediumPV}
              onChange={e => setIncludeMediumPV(e.target.checked)}
              aria-label="Include medium priority"
            />
            Include Medium Priority
          </label>
          <label className="flex items-center mt-1">
            <input
              type="checkbox"
              className="mr-2"
              checked={includeLowPV}
              onChange={e => setIncludeLowPV(e.target.checked)}
              aria-label="Include low priority"
            />
            Include Low Priority
          </label>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-md">
          <label className="block text-sm font-medium">Interrupted Sources</label>
          <select
            multiple
            className="w-full border p-2 rounded-md"
            value={excludedForInterrupt.map(String)}
            onChange={e =>
              setExcludedForInterrupt(
                Array.from(e.target.selectedOptions, o => Number(o.value))
              )
            }
            aria-label="Select interrupted incomes"
          >
            {incomeSources.map((src, i) => (
              <option key={i} value={i}>
                {src.name || `Source ${i + 1}`}
              </option>
            ))}
          </select>
        </div>
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
        {(() => {
          const color =
            pvSurvivalMonths < 6
              ? 'bg-red-200 text-red-800'
              : pvSurvivalMonths < 12
              ? 'bg-orange-200 text-orange-800'
              : 'bg-green-200 text-green-800';
          const label =
            pvSurvivalMonths < 6
              ? 'At risk'
              : pvSurvivalMonths < 12
              ? 'Caution'
              : 'Comfortable';
          return (
            <span className={`mt-2 inline-block px-2 py-1 rounded ${color}`}>{label}</span>
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
      <section className="bg-white p-4 rounded-xl shadow-md h-80">
        <h2 className="text-lg font-bold text-amber-700 mb-2">
          Projected Income by {chartView === 'monthly' ? 'Month' : 'Year'}
        </h2>
        <ResponsiveContainer width="100%" height="100%" role="img" aria-label="Projected income chart">
          <BarChart data={incomeData}>
            <XAxis dataKey="year" />
            <YAxis />
            <Tooltip formatter={value =>
              formatCurrency(value, settings.locale, settings.currency)
            } />
            <Legend />
            {incomeSources.map((src, i) => (
              <Bar
                key={i}
                dataKey={src.name || `Source ${i+1}`}
                stackId="a"
                fill={chartColors[i % chartColors.length]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </section>

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
