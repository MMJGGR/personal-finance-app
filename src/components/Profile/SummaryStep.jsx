import React from 'react';
import { useFinance } from '../../FinanceContext';
import RiskSummary from './RiskSummary.jsx';
import { deriveCategory } from '../../utils/riskUtils';

export default function SummaryStep() {
  const { profile } = useFinance();
  const category = deriveCategory(profile.riskScore);
  return (
    <div className="p-4 space-y-4">
      <RiskSummary score={profile.riskScore} category={category} />
      <ul className="list-disc pl-6 text-slate-700">
        <li>Review your details and adjust if needed.</li>
        <li>Your risk score influences investment recommendations.</li>
      </ul>
    </div>
  );
}
