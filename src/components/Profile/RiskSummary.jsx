import React from 'react'

export default function RiskSummary({ score = 0, category = 'balanced' }) {
  return (
    <div className="bg-amber-100 p-4 rounded-md">
      <p className="text-lg">
        Risk Score: <span className="font-semibold">{score}</span> —{' '}
        <span className="ml-2 font-medium capitalize">{category}</span>
      </p>
    </div>
  )
}
