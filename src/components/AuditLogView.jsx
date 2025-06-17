import React, { useEffect, useState } from 'react'
import storage from '../utils/storage'
import { buildCSV } from '../utils/csvUtils'
import { readAuditLog } from '../utils/auditLog'
import { Card, CardHeader, CardBody } from './common/Card.jsx'

export default function AuditLogView() {
  const [log, setLog] = useState(() => readAuditLog(storage))

  useEffect(() => {
    const unsub = storage.subscribe('auditLog', val => {
      try {
        setLog(val ? JSON.parse(val) : [])
      } catch {
        setLog([])
      }
    })
    return unsub
  }, [])

  const exportCSV = () => {
    const columns = ['Timestamp', 'Field', 'Old Value', 'New Value']
    const rows = log.map(entry => [entry.ts, entry.field, entry.oldValue, entry.newValue])
    const csv = buildCSV(columns, rows)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'audit-log.csv'
    a.click()
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-bold text-amber-800">Edit Audit Log</h2>
        <button
          onClick={exportCSV}
          className="border border-amber-600 px-2 py-1 rounded-md text-sm hover:bg-amber-50"
        >
          Export CSV
        </button>
      </CardHeader>
      <CardBody>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-1">Timestamp</th>
                <th className="text-left p-1">Field</th>
                <th className="text-left p-1">Old</th>
                <th className="text-left p-1">New</th>
              </tr>
            </thead>
            <tbody>
              {log.map((e, i) => (
                <tr key={i} className="border-b last:border-none">
                  <td className="p-1">{e.ts}</td>
                  <td className="p-1">{e.field}</td>
                  <td className="p-1">{String(e.oldValue)}</td>
                  <td className="p-1">{String(e.newValue)}</td>
                </tr>
              ))}
              {log.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-2 italic text-center text-slate-500">
                    No edits logged
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardBody>
    </Card>
  )
}
