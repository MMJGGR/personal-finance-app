import React from 'react';
import { useFinance } from '../../FinanceContext';
import RiskSummary from './RiskSummary.jsx';
import { deriveCategory } from '../../utils/riskUtils';

export default function SummaryStep() {
  const { profile, updateProfile, resetProfile } = useFinance()
  const category = deriveCategory(profile.riskScore)
  return (
    <div className="p-4 space-y-4">
      <RiskSummary score={profile.riskScore} category={category} />
      <ul className="list-disc pl-6 text-slate-700">
        <li>Review your details and adjust if needed.</li>
        <li>Your risk score influences investment recommendations.</li>
      </ul>
      <div className="text-right space-x-2">
        <button
          onClick={() => updateProfile(profile)}
          className="mt-2 border border-amber-600 bg-amber-600 text-white px-4 py-1 rounded-md text-sm hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
          aria-label="Save profile"
        >
          Save Profile
        </button>
        <button
          onClick={resetProfile}
          className="mt-2 border border-amber-600 px-4 py-1 rounded-md text-sm hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-500"
          aria-label="Reset profile to defaults"
        >
          Reset to Defaults
        </button>
      </div>
    </div>
  )
}
