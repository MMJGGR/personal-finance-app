import React from 'react';
import { useFinance } from './FinanceContext';
import { deriveCategory } from './utils/riskUtils';

export default function RiskAlert() {
  const { riskScore, strategy } = useFinance();
  const category = deriveCategory(riskScore);
  if (!strategy || strategy === category) return null;
  return (
    <div className="bg-amber-50 border border-amber-300 p-3 rounded-md text-sm" role="alert">
      Your risk profile is <strong className="capitalize">{category}</strong>. Consider adjusting your strategy from
      <strong className="ml-1">{strategy}</strong>.
    </div>
  );
}
