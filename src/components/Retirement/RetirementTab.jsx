import React, { useState } from 'react';
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

// Placeholder for the Monte Carlo engine
const runMonteCarloSimulation = () => {
  // This will be implemented in the next step
  return {
    successRate: 0,
    percentiles: {},
  };
};

export default function RetirementTab() {
  const {
    profile,
    assetsList,
    investmentContributions,
    settings,
  } = useFinance();

  const [retirementIncome, setRetirementIncome] = useState(50000);
  const [numSimulations, setNumSimulations] = useState(1000);
  const [simulationResult, setSimulationResult] = useState(null);

  const handleRunSimulation = () => {
    const initialPortfolioValue = assetsList.reduce(
      (sum, asset) => (asset.type === 'Portfolio' ? sum + asset.amount : sum),
      0
    );
    const annualContribution = investmentContributions.reduce(
      (sum, contrib) => sum + contrib.amount * contrib.frequency,
      0
    );

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
    });
    setSimulationResult(result);
  };

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-amber-800">Retirement Planner</h2>

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
            className="w-full px-4 py-2 font-bold text-white bg-amber-600 rounded-md hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
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