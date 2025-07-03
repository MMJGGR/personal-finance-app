import React, { useState } from 'react';
import { useFinance } from '../../FinanceContext';
import { riskSurveyQuestions } from '../../config/riskSurvey';
import { calculateRiskScore, deriveCategory } from '../../utils/riskUtils';

export default function QuestionnaireStep({ onComplete, onBack }) {
  const { profile, updateProfile } = useFinance();
  const [answers, setAnswers] = useState(
    Array.isArray(profile.riskSurveyAnswers)
      ? [...profile.riskSurveyAnswers]
      : Array(riskSurveyQuestions.length).fill(0)
  );
  const [idx, setIdx] = useState(0);

  const handleSelect = val => {
    const next = [...answers];
    next[idx] = Number(val);
    setAnswers(next);
  };

  const nextStep = () => {
    if (idx < riskSurveyQuestions.length - 1) {
      setIdx(idx + 1);
    } else {
      const updated = {
        ...profile,
        riskSurveyAnswers: answers,
      };
      const score = calculateRiskScore(updated);
      const riskCategory = deriveCategory(score);
      updateProfile({ ...updated, riskScore: score, riskCategory });
      if (onComplete) onComplete();
    }
  };

  const prevStep = () => {
    if (idx > 0) setIdx(idx - 1);
    else if (onBack) onBack();
  };

  const q = riskSurveyQuestions[idx];
  const progress = `${idx + 1} / ${riskSurveyQuestions.length}`;

  return (
    <div className="space-y-4 p-4">
      <div className="text-sm text-slate-600">Question {progress}</div>
      <p className="font-medium text-slate-700">{q.text}</p>
      <select
        value={answers[idx] || 0}
        onChange={e => handleSelect(e.target.value)}
        className="border rounded-md p-2 mt-2"
      >
        <option value={0}>Select…</option>
        {[1,2,3,4,5].map(v => (
          <option key={v} value={v}>{v}</option>
        ))}
      </select>
      <div className="space-x-2 mt-4">
        <button onClick={prevStep} className="px-3 py-1 border rounded-md">Back</button>
        <button onClick={nextStep} className="px-3 py-1 border rounded-md bg-amber-600 text-white">{idx === riskSurveyQuestions.length - 1 ? 'Finish' : 'Next'}</button>
      </div>
    </div>
  );
}
