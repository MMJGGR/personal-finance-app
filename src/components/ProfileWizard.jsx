import React, { useState } from 'react';
import { useFinance } from '../FinanceContext';
import PersonalDetailsStep from './Profile/PersonalDetailsStep.jsx';
import IncomeStep from './Profile/IncomeStep.jsx';
import AssetsStep from './Profile/AssetsStep.jsx';
import GoalsStep from './Profile/GoalsStep.jsx';
import QuestionnaireStep from './Profile/QuestionnaireStep.jsx';
import SummaryStep from './Profile/SummaryStep.jsx';

export default function ProfileWizard() {
  const [step, setStep] = useState(0);
  const { setProfileComplete } = useFinance();

  return (
    <div>
      {step === 0 && <PersonalDetailsStep onNext={() => setStep(1)} />}
      {step === 1 && <IncomeStep onBack={() => setStep(0)} onNext={() => setStep(2)} />}
      {step === 2 && <AssetsStep onBack={() => setStep(1)} onNext={() => setStep(3)} />}
      {step === 3 && <GoalsStep onBack={() => setStep(2)} onNext={() => setStep(4)} />}
      {step === 4 && (
        <QuestionnaireStep
          onBack={() => setStep(3)}
          onComplete={() => {
            setStep(5);
            setProfileComplete(true);
          }}
        />
      )}
      {step === 5 && <SummaryStep />}
    </div>
  );
}
