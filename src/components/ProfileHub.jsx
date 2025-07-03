import React from 'react'
import { useFinance } from '../FinanceContext'
import ProfileWizard from './Profile/RiskOnboardingWizard.jsx'
import ProfileSummary from './Profile/SummaryStep.jsx'
import SnapshotCarousel from './SnapshotCarousel.jsx'

export default function ProfileHub() {
  const { profileComplete } = useFinance()

  if (!profileComplete) {
    return <ProfileWizard />
  }

  return (
    <div className="space-y-6">
      <ProfileSummary />
      <SnapshotCarousel />
    </div>
  )
}
