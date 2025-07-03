import React, { useState } from 'react'
import { readVersions } from '../utils/versionHistory'
import storage from '../utils/storage'
import { useFinance } from '../FinanceContext'
import { Card, CardHeader, CardBody } from './common/Card.jsx'

export default function SnapshotCarousel() {
  const { revertProfile } = useFinance()
  const [versions] = useState(() => readVersions(storage))
  const [index, setIndex] = useState(versions.length - 1)
  if (versions.length === 0) return null
  const prev = () => setIndex(i => Math.max(0, i - 1))
  const next = () => setIndex(i => Math.min(versions.length - 1, i + 1))
  const snap = versions[index]
  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold text-amber-800">Profile Snapshots</h3>
      </CardHeader>
      <CardBody>
        <div className="flex items-center gap-2 mb-2 text-sm">
          <button onClick={prev} disabled={index===0} className="px-2 py-1 border rounded">Prev</button>
          <span>{index + 1} / {versions.length}</span>
          <button onClick={next} disabled={index===versions.length-1} className="px-2 py-1 border rounded">Next</button>
          <button onClick={() => revertProfile(index)} className="ml-auto px-2 py-1 bg-amber-600 text-white rounded">Revert</button>
        </div>
        <pre className="text-xs bg-gray-50 p-2 overflow-auto">{JSON.stringify(snap.profile, null, 2)}</pre>
      </CardBody>
    </Card>
  )
}
