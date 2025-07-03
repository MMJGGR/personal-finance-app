import React, { useState } from 'react';
import { useFinance } from '../../FinanceContext';
import PersonalDetailsStep from './PersonalDetailsStep.jsx';
import QuestionnaireStep from './QuestionnaireStep.jsx';
import SummaryStep from './SummaryStep.jsx';

export default function RiskOnboardingWizard() {
  const [step, setStep] = useState(0);
  const { setProfileComplete } = useFinance();

  return (
    <div>
      {step === 0 && <PersonalDetailsStep onNext={() => setStep(1)} />}
      {step === 1 && (
        <QuestionnaireStep
          onBack={() => setStep(0)}
          onComplete={() => {
            setStep(2);
            setProfileComplete(true);
          }}
        />
      )}
      {step === 2 && <SummaryStep />}
    </div>
  );
}
