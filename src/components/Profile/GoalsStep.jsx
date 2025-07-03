import React, { useState, useEffect } from 'react';
import { useFinance } from '../../FinanceContext';
import storage from '../../utils/storage';
import { addVersion } from '../../utils/versionHistory';

const goals = ['Preservation', 'Income', 'Growth'];
const horizons = ['<3 years', '3–7 years', '>7 years'];

export default function GoalsStep({ onNext, onBack }) {
  const { profile, updateProfile } = useFinance();
  const [goal, setGoal] = useState(profile.investmentGoal || '');
  const [horizon, setHorizon] = useState(profile.investmentHorizon || '');

  useEffect(() => {
    setGoal(profile.investmentGoal || '');
    setHorizon(profile.investmentHorizon || '');
  }, [profile.investmentGoal, profile.investmentHorizon]);

  const handleNext = () => {
    const updated = {
      ...profile,
      investmentGoal: goal,
      investmentHorizon: horizon,
    };
    updateProfile(updated);
    addVersion(storage, updated);
    if (onNext) onNext();
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-semibold text-slate-700">Investment Goals</h2>
      <label className="block">
        <span className="text-sm text-slate-600">Goal</span>
        <select
          value={goal}
          onChange={e => setGoal(e.target.value)}
          className="w-full border rounded-md p-2"
        >
          <option value="">Select…</option>
          {goals.map(g => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="text-sm text-slate-600">Investment Horizon</span>
        <select
          value={horizon}
          onChange={e => setHorizon(e.target.value)}
          className="w-full border rounded-md p-2"
        >
          <option value="">Select…</option>
          {horizons.map(h => (
            <option key={h} value={h}>{h}</option>
          ))}
        </select>
      </label>
      <div className="text-right space-x-2">
        <button onClick={onBack} className="border rounded-md px-4 py-1">Back</button>
        <button
          onClick={handleNext}
          className="border rounded-md bg-amber-600 text-white px-4 py-1"
        >
          Next
        </button>
      </div>
    </div>
  );
}
