import React, { useState, useMemo } from 'react';
import { useFinance } from '../../FinanceContext';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { runMonteCarloSimulation } from '../../utils/monteCarlo.js';
import { calculateNSSF } from '../../utils/nssfCalculator';
import { formatCurrency } from '../../utils/formatters';
import { calculatePensionIncome } from '../../utils/pensionProjection.js';
import { pensionFormSchema } from '../../schemas/inputs.schema.js';
import AdequacyAlert from '../../AdequacyAlert.jsx';

export default function RetirementTab() {
  const {
    profile,
    assetsList,
    investmentContributions,
    settings,
    incomeSources,
    updateSettings,
    fundingFlag,
    fundingGap,
  } = useFinance();

  const [retirementIncome, setRetirementIncome] = useState(50000);
  const [numSimulations, setNumSimulations] = useState(1000);
  const [simulationResult, setSimulationResult] = useState(null);
  const [privatePensionContributions, setPrivatePensionContributions] = useState([]);
  const currentYear = new Date().getFullYear();
  const [pensionInputs, setPensionInputs] = useState({
    amount: 0,
    startYear: currentYear,
    duration: 1,
    frequency: 'Monthly',
    pensionType: 'Annuity',
  });
  const [touched, setTouched] = useState({});

  const handleRunSimulation = () => {
    const initialPortfolioValue = assetsList.reduce(
      (sum, asset) => (asset.type === 'Portfolio' ? sum + asset.amount : sum),
      0
    );
    const annualContribution = investmentContributions.reduce(
      (sum, contrib) => sum + contrib.amount * contrib.frequency,
      0
    ) + privatePensionContributions.reduce((sum, ppc) => sum + ppc.amount * ppc.frequency, 0);

    const projectedPensionAsset = assetsList.find(a => a.id === 'projected-pension-value');
    const projectedPensionValue = projectedPensionAsset ? projectedPensionAsset.amount : 0;

    const result = runMonteCarloSimulation({
      initialPortfolioValue,
      annualContribution,
      retirementAge: settings.retirementAge,
      lifeExpectancy: profile.lifeExpectancy,
      age: profile.age,
      expectedReturn: settings.expectedReturn,
      standardDeviation: settings.standardDeviation || 15, // Default to 15% if not set
      numSimulations,
      retirementIncome,
      projectedPensionValue,
    });
    setSimulationResult(result);
  };

  const formatChartData = () => {
    if (!simulationResult) return [];
    const { percentiles } = simulationResult;
    const years = percentiles[50].map(d => d.year);
    return years.map((year, i) => ({
      year,
      p10: percentiles[10][i].value,
      p25: percentiles[25][i].value,
      p50: percentiles[50][i].value,
      p75: percentiles[75][i].value,
      p90: percentiles[90][i].value,
    }));
  };

  const chartData = formatChartData();

  const validation = useMemo(() => pensionFormSchema.safeParse(pensionInputs), [pensionInputs]);
  const errors = useMemo(() => {
    if (validation.success) return {};
    const out = {};
    validation.error.errors.forEach(e => {
      out[e.path[0]] = e.message;
    });
    return out;
  }, [validation]);
  const isValid = validation.success;

  const pensionSummary = useMemo(() => {
    if (!isValid) return { monthlyIncome: 0 };
    return calculatePensionIncome({
      ...pensionInputs,
      expectedReturn: settings.expectedReturn,
    });
  }, [pensionInputs, settings.expectedReturn, isValid]);

  const kenyanSalaries = useMemo(() => {
    return incomeSources.filter(src => src.type === 'Kenyan Salary');
  }, [incomeSources]);

  const totalEmployeeNSSF = useMemo(() => {
    return kenyanSalaries.reduce((sum, src) => {
      const nssf = calculateNSSF(src.grossSalary);
      return sum + nssf.employeeContribution;
    }, 0);
  }, [kenyanSalaries]);

  const totalEmployerNSSF = useMemo(() => {
    return kenyanSalaries.reduce((sum, src) => {
      const nssf = calculateNSSF(src.grossSalary);
      return sum + nssf.employerContribution;
    }, 0);
  }, [kenyanSalaries]);

  const totalNSSF = useMemo(() => {
    return totalEmployeeNSSF + totalEmployerNSSF;
  }, [totalEmployeeNSSF, totalEmployerNSSF]);

  const addPrivatePensionContribution = () => {
    setPrivatePensionContributions(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: '',
        amount: 0,
        frequency: 12, // Default to monthly
      },
    ]);
  };

  const updatePrivatePensionContribution = (id, field, value) => {
    setPrivatePensionContributions(prev =>
      prev.map(ppc => (ppc.id === id ? { ...ppc, [field]: value } : ppc))
    );
  };

  const deletePrivatePensionContribution = (id) => {
    setPrivatePensionContributions(prev => prev.filter(ppc => ppc.id !== id));
  };

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-amber-800">Retirement Planner</h2>

      {/* NSSF Summary */}
      {kenyanSalaries.length > 0 && (
        <div className="p-6 bg-white rounded-lg shadow">
          <h3 className="text-xl font-bold text-amber-800 mb-4">NSSF Contributions (Annual)</h3>
          <p>Employee Contribution: <span className="font-semibold">{formatCurrency(totalEmployeeNSSF * 12, settings.locale, settings.currency)}</span></p>
          <p>Employer Contribution: <span className="font-semibold">{formatCurrency(totalEmployerNSSF * 12, settings.locale, settings.currency)}</span></p>
          <p>Total NSSF Contribution: <span className="font-semibold">{formatCurrency(totalNSSF * 12, settings.locale, settings.currency)}</span></p>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <div className="p-6 bg-white rounded-lg shadow">
          <h3 className="text-lg font-bold text-amber-800 mb-4">Accumulation Phase</h3>
          <label htmlFor="pension-amount" className="block text-sm font-medium text-gray-700">
            Contribution Amount (KES)
            <span title="How much you plan to contribute each period" className="ml-1 cursor-help text-gray-500">?</span>
          </label>
          <input
            id="pension-amount"
            type="number"
            value={pensionInputs.amount}
            onBlur={() => setTouched(t => ({ ...t, amount: true }))}
            onChange={e => setPensionInputs({ ...pensionInputs, amount: Number(e.target.value) })}
            className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
          />
          {touched.amount && errors.amount && (
            <p className="text-sm text-red-600">{errors.amount}</p>
          )}

          <label htmlFor="start-year" className="block mt-4 text-sm font-medium text-gray-700">
            Start Year
            <span title="Year when contributions begin" className="ml-1 cursor-help text-gray-500">?</span>
          </label>
          <input
            id="start-year"
            type="number"
            value={pensionInputs.startYear}
            onBlur={() => setTouched(t => ({ ...t, startYear: true }))}
            onChange={e => setPensionInputs({ ...pensionInputs, startYear: Number(e.target.value) })}
            className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
          />
          {touched.startYear && errors.startYear && (
            <p className="text-sm text-red-600">{errors.startYear}</p>
          )}

          <label htmlFor="duration" className="block mt-4 text-sm font-medium text-gray-700">
            Contribution Duration (Years)
            <span title="Number of years you will contribute" className="ml-1 cursor-help text-gray-500">?</span>
          </label>
          <input
            id="duration"
            type="number"
            value={pensionInputs.duration}
            onBlur={() => setTouched(t => ({ ...t, duration: true }))}
            onChange={e => setPensionInputs({ ...pensionInputs, duration: Number(e.target.value) })}
            className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
          />
          {touched.duration && errors.duration && (
            <p className="text-sm text-red-600">{errors.duration}</p>
          )}

          <label htmlFor="frequency" className="block mt-4 text-sm font-medium text-gray-700">
            Frequency
            <span title="How often you save" className="ml-1 cursor-help text-gray-500">?</span>
          </label>
          <select
            id="frequency"
            value={pensionInputs.frequency}
            onBlur={() => setTouched(t => ({ ...t, frequency: true }))}
            onChange={e => setPensionInputs({ ...pensionInputs, frequency: e.target.value })}
            className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
          >
            <option value="Monthly">Monthly</option>
            <option value="Annually">Annually</option>
          </select>
        </div>

        <div className="p-6 bg-white rounded-lg shadow">
          <h3 className="text-lg font-bold text-amber-800 mb-4">Drawdown Phase</h3>
          <label htmlFor="pension-type" className="block text-sm font-medium text-gray-700">
            Pension Type
            <span title="Choose Annuity for fixed payments or Self-Managed for drawdown" className="ml-1 cursor-help text-gray-500">?</span>
          </label>
          <select
            id="pension-type"
            value={pensionInputs.pensionType}
            onBlur={() => setTouched(t => ({ ...t, pensionType: true }))}
            onChange={e => {
              setPensionInputs({ ...pensionInputs, pensionType: e.target.value })
              updateSettings({ ...settings, pensionType: e.target.value })
            }}
            className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
          >
            <option value="Annuity">Annuity</option>
            <option value="Self-Managed">Self-Managed</option>
          </select>
          <div className="mt-4 font-semibold">
            Expected Monthly Income at Retirement:{' '}
            {formatCurrency(pensionSummary.monthlyIncome, settings.locale, settings.currency)}
          </div>

          <label htmlFor="life-exp" className="block mt-4 text-sm font-medium text-gray-700">
            Life Expectancy
          </label>
          <input
            id="life-exp"
            type="number"
            value={settings.lifeExpectancyOverride}
            onChange={e => updateSettings({ ...settings, lifeExpectancyOverride: Number(e.target.value) })}
            className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
          />

          <label htmlFor="replacement-rate" className="block mt-4 text-sm font-medium text-gray-700">
            Target Replacement Rate (%)
          </label>
          <input
            id="replacement-rate"
            type="number"
            value={settings.replacementRate}
            onChange={e => updateSettings({ ...settings, replacementRate: Number(e.target.value) })}
            className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
          />

          <label htmlFor="real-return" className="block mt-4 text-sm font-medium text-gray-700">
            Real Return Assumption (%)
          </label>
          <input
            id="real-return"
            type="number"
            value={settings.realReturn}
            onChange={e => updateSettings({ ...settings, realReturn: Number(e.target.value) })}
            className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
          />

          {fundingFlag && (
            <div className="mt-4 text-sm">
              <AdequacyAlert
                message={
                  fundingFlag === 'shortfall'
                    ? `Projected income short by ${formatCurrency(Math.abs(fundingGap), settings.locale, settings.currency)}`
                    : fundingFlag === 'overfunded'
                      ? `Projected income exceeds target by ${formatCurrency(fundingGap, settings.locale, settings.currency)}`
                      : 'Retirement funding on track'
                }
              />
            </div>
          )}
        </div>
      </div>

      {/* Private Pension Contributions */}
      <div className="p-6 bg-white rounded-lg shadow">
        <h3 className="text-xl font-bold text-amber-800 mb-4">Voluntary Private Pension Contributions</h3>
        <div className="space-y-4">
          {privatePensionContributions.map(ppc => (
            <div key={ppc.id} className="grid grid-cols-3 gap-4 items-center">
              <input
                type="text"
                placeholder="Name"
                value={ppc.name}
                onChange={e => updatePrivatePensionContribution(ppc.id, 'name', e.target.value)}
                className="w-full border p-2 rounded-md"
              />
              <input
                type="number"
                placeholder="Amount"
                value={ppc.amount}
                onChange={e => updatePrivatePensionContribution(ppc.id, 'amount', Number(e.target.value))}
                className="w-full border p-2 rounded-md"
              />
              <select
                value={ppc.frequency}
                onChange={e => updatePrivatePensionContribution(ppc.id, 'frequency', Number(e.target.value))}
                className="w-full border p-2 rounded-md"
              >
                <option value={1}>Annually</option>
                <option value={4}>Quarterly</option>
                <option value={12}>Monthly</option>
              </select>
              <button
                onClick={() => deletePrivatePensionContribution(ppc.id)}
                className="col-span-3 text-red-500 hover:text-red-700"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={addPrivatePensionContribution}
          className="mt-4 bg-amber-400 hover:bg-amber-300 text-white px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          ➕ Add Private Pension Contribution
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="p-4 bg-white rounded-lg shadow">
          <label
            htmlFor="retirement-income"
            className="block text-sm font-medium text-gray-700"
          >
            Desired Annual Retirement Income
          </label>
          <input
            type="number"
            id="retirement-income"
            value={retirementIncome}
            onChange={(e) => setRetirementIncome(Number(e.target.value))}
            className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
          />
        </div>
        <div className="p-4 bg-white rounded-lg shadow">
          <label
            htmlFor="num-simulations"
            className="block text-sm font-medium text-gray-700"
          >
            Number of Simulations
          </label>
          <input
            type="number"
            id="num-simulations"
            value={numSimulations}
            onChange={(e) => setNumSimulations(Number(e.target.value))}
            className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
          />
        </div>
        <div className="flex items-end">
          <button
            onClick={handleRunSimulation}
            disabled={!isValid}
            className="w-full px-4 py-2 font-bold text-white bg-amber-600 rounded-md hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50"
          >
            Run Simulation
          </button>
        </div>
      </div>

      {simulationResult && (
        <div className="p-6 bg-white rounded-lg shadow">
          <h3 className="text-xl font-bold text-amber-800">
            Simulation Results
          </h3>
          <p className="mt-2 text-lg">
            Probability of Success:{' '}
            <span className="font-bold text-green-600">
              {simulationResult.successRate.toFixed(2)}%
            </span>
          </p>
          <div className="w-full mt-6" style={{ height: '400px' }}>
            <ResponsiveContainer>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="p10" stroke="#ccc" dot={false} name="10th Percentile" />
                <Line type="monotone" dataKey="p25" stroke="#aaa" dot={false} name="25th Percentile" />
                <Line type="monotone" dataKey="p50" stroke="#8884d8" dot={false} name="Median" />
                <Line type="monotone" dataKey="p75" stroke="#aaa" dot={false} name="75th Percentile" />
                <Line type="monotone" dataKey="p90" stroke="#ccc" dot={false} name="90th Percentile" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}