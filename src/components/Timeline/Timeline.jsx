import React, { useState } from 'react'
import { useFinance } from '../../FinanceContext'
import { Card, CardHeader, CardBody } from '../common/Card.jsx'

export default function Timeline() {
  const {
    events,
    addEvent,
    removeEvent,
    startYear,
    years,
    selectedYear,
    setSelectedYear,
  } = useFinance()
  const [form, setForm] = useState({ date: '', label: '', value: '' })

  const submit = e => {
    e.preventDefault()
    if (!form.date || !form.label) return
    const ev = {
      id: crypto.randomUUID(),
      date: form.date,
      label: form.label,
      value: form.value ? Number(form.value) : null,
    }
    addEvent(ev)
    setForm({ date: '', label: '', value: '' })
  }

  const sorted = [...events].sort((a, b) => new Date(a.date) - new Date(b.date))
  const rangeEnd = selectedYear || startYear
  const filtered = sorted.filter(ev => {
    const y = new Date(ev.date).getFullYear()
    return y <= rangeEnd
  })

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold text-amber-800">Life Events</h3>
      </CardHeader>
      <CardBody>
        <div className="flex items-center gap-2 mb-3">
          <input
            type="range"
            min={startYear}
            max={startYear + years - 1}
            value={selectedYear}
            onChange={e => setSelectedYear(Number(e.target.value))}
            className="flex-1"
          />
          <span className="text-sm w-12 text-center">{selectedYear}</span>
        </div>
        <form onSubmit={submit} className="mb-3 flex flex-wrap gap-2 text-sm">
          <input
            type="date"
            value={form.date}
            onChange={e => setForm({ ...form, date: e.target.value })}
            className="border p-1 rounded-md"
            required
          />
          <input
            placeholder="Label"
            value={form.label}
            onChange={e => setForm({ ...form, label: e.target.value })}
            className="border p-1 rounded-md flex-1"
            required
          />
          <input
            placeholder="Impact"
            value={form.value}
            onChange={e => setForm({ ...form, value: e.target.value })}
            className="border p-1 rounded-md w-24"
          />
          <button
            type="submit"
            className="bg-amber-600 text-white px-2 py-1 rounded-md"
          >
            Add
          </button>
        </form>
        <ul className="space-y-1 text-sm">
          {filtered.map(ev => (
            <li key={ev.id} className="flex justify-between items-center border-b pb-1 last:border-none">
              <span>
                {ev.date} – {ev.label}
                {ev.value != null && ` (${ev.value})`}
              </span>
              <button
                onClick={() => removeEvent(ev.id)}
                className="text-amber-600 text-xs"
              >
                Remove
              </button>
            </li>
          ))}
          {filtered.length === 0 && (
            <li className="italic text-slate-500">No events</li>
          )}
        </ul>
      </CardBody>
    </Card>
  )
}
