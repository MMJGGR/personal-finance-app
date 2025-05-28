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
import { useFinance } from './FinanceContext';
import { calculatePV } from './utils/financeUtils';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

export default function IncomeTab() {
  const {
    incomeSources, setIncomeSources,
    startYear, setStartYear,
    discountRate, setDiscountRate,
    years, setYears,
    monthlyExpense,
    settings,
    setIncomePV,
  } = useFinance();

  // 1. Compute PV per stream & total
  const pvPerStream = useMemo(
    () => incomeSources.map(src =>
      calculatePV(src.amount, src.frequency, src.growth, discountRate, years)
    ),
    [incomeSources, discountRate, years]
  );
  const totalPV = useMemo(() => pvPerStream.reduce((a, b) => a + b, 0), [pvPerStream]);

  // 2. Compute interruption months (guard zero expense)
  const interruptionMonths = useMemo(() => {
    return monthlyExpense > 0
      ? Math.floor(totalPV / (monthlyExpense * 12) * 12)
      : 0;
  }, [totalPV, monthlyExpense]);

  // 3. Build projection data for chart
  const incomeData = useMemo(() => {
    return Array.from({ length: years }, (_, i) => {
      const year = startYear + i;
      const entry = { year: `${year}` };
      incomeSources.forEach(src => {
        entry[src.name || `Source ${i + 1}`] = Number(
          (src.amount * src.frequency * Math.pow(1 + src.growth/100, i)).toFixed(2)
        );
      });
      return entry;
    });
  }, [incomeSources, startYear, years]);

  // 4. Sync totalPV back into context & localStorage
  useEffect(() => {
    setIncomePV(totalPV);
    localStorage.setItem('incomePV', totalPV.toString());
  }, [totalPV, setIncomePV]);

  // --- Handlers for form inputs ---
  const onFieldChange = (idx, field, raw) => {
    const updated = incomeSources.map((src, i) => {
      if (i !== idx) return src;
      if (field === 'name') return { ...src, name: raw };
      const val = parseFloat(raw);
      return { ...src, [field]: isNaN(val) ? 0 : Math.max(0, val) };
    });
    setIncomeSources(updated);
  };

  const addIncome = () => {
    setIncomeSources([
      ...incomeSources,
      { name: '', amount: 0, frequency: 1, growth: 0 },
    ]);
  };

  const removeIncome = (idx) => {
    setIncomeSources(incomeSources.filter((_, i) => i !== idx));
  };

  // --- Export JSON payload ---
  const exportJSON = () => {
    const payload = {
      startYear, incomeSources,
      assumptions: { discountRate, years, monthlyExpense },
      pvPerStream, totalPV,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'income-data.json';
    a.click();
  };

  // Chart palette (aligned with warm amber theme)
  const chartColors = [
    '#FBBF24','#F59E0B','#FDBA74','#FB923C',
    '#F472B6','#C084FC','#34D399','#60A5FA',
  ];

  // --- Render ---
  return (
    <div className="space-y-8">
      {/* Income Streams Form */}
      <section>
        <h2 className="text-xl font-bold text-amber-700 mb-4">Income Sources</h2>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {incomeSources.map((src, i) => (
            <div key={i} className="bg-white p-4 rounded-xl shadow-md relative">
              <label className="block text-sm font-medium">Source Name</label>
              <input
                type="text"
                className="w-full border p-2 rounded-md"
                value={src.name}
                onChange={e => onFieldChange(i, 'name', e.target.value)}
                required
              />

              <label className="block text-sm font-medium mt-2">Amount ({settings.currency})</label>
              <input
                type="number"
                className="w-full border p-2 rounded-md"
                value={src.amount}
                onChange={e => onFieldChange(i, 'amount', e.target.value)}
                min={0}
              />

              <label className="block text-sm font-medium mt-2">Frequency (/yr)</label>
              <input
                type="number"
                className="w-full border p-2 rounded-md"
                value={src.frequency}
                onChange={e => onFieldChange(i, 'frequency', e.target.value)}
                min={0}
              />

              <label className="block text-sm font-medium mt-2">Growth Rate (%)</label>
              <input
                type="number"
                className="w-full border p-2 rounded-md"
                value={src.growth}
                onChange={e => onFieldChange(i, 'growth', e.target.value)}
                step={0.1}
              />

              <button
                onClick={() => removeIncome(i)}
                className="absolute top-2 right-2 text-red-600 hover:text-red-800"
                aria-label="Remove income source"
              >✖</button>
            </div>
          ))}
        </div>
        <button
          onClick={addIncome}
          className="mt-4 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-md"
        >➕ Add Income</button>
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
          />

          <label className="block text-sm font-medium mt-4">Discount Rate (%)</label>
          <input
            type="number"
            className="w-full border p-2 rounded-md"
            value={discountRate}
            onChange={e => setDiscountRate(+e.target.value)}
            min={0} max={100} step={0.1}
          />

          <label className="block text-sm font-medium mt-4">Projection Years</label>
          <input
            type="number"
            className="w-full border p-2 rounded-md"
            value={years}
            onChange={e => setYears(+e.target.value)}
            min={1}
          />
        </div>

        <div className="bg-white p-4 rounded-xl shadow-md">
          <p className="text-sm italic text-slate-500">
            Monthly Expenses (from Expenses tab):
            <span className="font-semibold text-amber-700">
              {' '}
              {monthlyExpense.toLocaleString(settings.locale, {
                style: 'currency', currency: settings.currency
              })}
            </span>
          </p>
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
                {pvPerStream[i].toLocaleString(settings.locale, {
                  style: 'currency', currency: settings.currency
                })}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-4 font-semibold">
          Total PV:&nbsp;
          <span className="text-green-600 text-xl">
            {totalPV.toLocaleString(settings.locale, {
              style: 'currency', currency: settings.currency
            })}
          </span>
        </p>
        <p className="text-sm mt-2">
          You could survive&nbsp;
          <strong>{interruptionMonths}</strong>&nbsp;months at&nbsp;
          {monthlyExpense.toLocaleString(settings.locale, {
            style: 'currency', currency: settings.currency
          })}/mo.
        </p>
      </section>

      {/* Projection Chart */}
      <section className="bg-white p-4 rounded-xl shadow-md h-80">
        <h2 className="text-lg font-bold text-amber-700 mb-2">Projected Income by Year</h2>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={incomeData}>
            <XAxis dataKey="year" />
            <YAxis />
            <Tooltip formatter={value =>
              value.toLocaleString(settings.locale, {
                style: 'currency', currency: settings.currency
              })
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
          className="bg-white border border-amber-600 text-amber-700 px-4 py-2 rounded-md hover:bg-amber-50"
        >
          📁 Export Income to JSON
        </button>
      </section>
    </div>
  );
}
