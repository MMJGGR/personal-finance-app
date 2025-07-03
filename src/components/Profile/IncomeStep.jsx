import React, { useState, useEffect } from 'react';
import { useFinance } from '../../FinanceContext';
import storage from '../../utils/storage';
import { addVersion } from '../../utils/versionHistory';

export default function IncomeStep({ onNext, onBack }) {
  const { profile, updateProfile } = useFinance();
  const [annualIncome, setAnnualIncome] = useState(profile.annualIncome || 0);

  useEffect(() => {
    setAnnualIncome(profile.annualIncome || 0);
  }, [profile.annualIncome]);

  const handleNext = () => {
    const updated = { ...profile, annualIncome: Number(annualIncome) || 0 };
    updateProfile(updated);
    addVersion(storage, updated);
    if (onNext) onNext();
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-semibold text-slate-700">Income</h2>
      <label className="block">
        <span className="text-sm text-slate-600">Annual Income (KES)</span>
        <input
          type="number"
          value={annualIncome}
          onChange={e => setAnnualIncome(parseFloat(e.target.value) || 0)}
          className="w-full border rounded-md p-2"
        />
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
