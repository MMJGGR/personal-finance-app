import React from 'react'
import { useFinance } from '../FinanceContext'
import { exportFullReport } from '../utils/exportHelpers'

export default function ExportReportButton() {
  const finance = useFinance()
  const handleClick = () => {
    const report = exportFullReport(finance)
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'report.json'
    a.click()
    window.dispatchEvent(new CustomEvent('reportGenerated', { detail: report }))
    if (finance.settings.apiEndpoint) {
      fetch(finance.settings.apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report)
      }).catch(() => {})
    }
  }
  return (
    <button
      onClick={handleClick}
      className="h-10 px-4 bg-white text-amber-600 rounded hover:bg-amber-50"
      aria-label="Export Report"
    >
      Export
    </button>
  )
}
