import React, { useState, useEffect } from 'react';
import { useFinance } from '../../FinanceContext';
import storage from '../../utils/storage';
import { addVersion } from '../../utils/versionHistory';

export default function AssetsStep({ onNext, onBack }) {
  const { profile, updateProfile } = useFinance();
  const [netWorth, setNetWorth] = useState(profile.netWorth || 0);
  const [liquidNetWorth, setLiquidNetWorth] = useState(profile.liquidNetWorth || 0);

  useEffect(() => {
    setNetWorth(profile.netWorth || 0);
    setLiquidNetWorth(profile.liquidNetWorth || 0);
  }, [profile.netWorth, profile.liquidNetWorth]);

  const handleNext = () => {
    const updated = {
      ...profile,
      netWorth: Number(netWorth) || 0,
      liquidNetWorth: Number(liquidNetWorth) || 0,
    };
    updateProfile(updated);
    addVersion(storage, updated);
    if (onNext) onNext();
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-semibold text-slate-700">Assets</h2>
      <label className="block">
        <span className="text-sm text-slate-600">Total Net Worth (KES)</span>
        <input
          type="number"
          value={netWorth}
          onChange={e => setNetWorth(parseFloat(e.target.value) || 0)}
          className="w-full border rounded-md p-2"
        />
      </label>
      <label className="block">
        <span className="text-sm text-slate-600">Liquid Net Worth (KES)</span>
        <input
          type="number"
          value={liquidNetWorth}
          onChange={e => setLiquidNetWorth(parseFloat(e.target.value) || 0)}
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
