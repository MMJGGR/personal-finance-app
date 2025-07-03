import React from 'react'
import Timeline from '../components/Timeline/Timeline.jsx'
import WealthChart from '../components/Timeline/WealthChart.jsx'
import SnapshotCarousel from '../components/SnapshotCarousel.jsx'

export default function TimelineTab() {
  return (
    <div className="space-y-6 p-6">
      <Timeline />
      <WealthChart />
      <SnapshotCarousel />
    </div>
  )
}
