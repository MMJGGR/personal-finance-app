import React, { useState, useEffect } from 'react'
import { z } from 'zod'

const taxBracketSchema = z.object({
  min: z.number().min(0, "Min value must be non-negative"),
  max: z.number().nullable().optional(),
  rate: z.number().min(0).max(1, "Rate must be between 0 and 1"),
}).refine(data => {
  if (data.max !== null && data.max !== undefined && data.min >= data.max) {
    return false
  }
  return true
}, { message: "Max value must be greater than min value", path: ['max'] })

export default function TaxBracketEditor({ taxBrackets, onChange }) {
  const [brackets, setBrackets] = useState(taxBrackets)
  const [errors, setErrors] = useState([])

  useEffect(() => {
    setBrackets(taxBrackets)
  }, [taxBrackets])

  const validateAndSet = (newBrackets) => {
    const validationResults = newBrackets.map(bracket => taxBracketSchema.safeParse(bracket))
    const newErrors = validationResults.map((result, index) => {
      if (!result.success) {
        return { index, issues: result.error.issues }
      }
      return null
    }).filter(Boolean)

    setErrors(newErrors)
    if (newErrors.length === 0) {
      onChange(newBrackets)
    }
    setBrackets(newBrackets)
  }

  const handleBracketChange = (index, field, value) => {
    const newBrackets = [...brackets]
    newBrackets[index] = {
      ...newBrackets[index],
      [field]: field === 'rate' ? parseFloat(value) / 100 : parseFloat(value),
    }
    validateAndSet(newBrackets)
  }

  const handleAddBracket = () => {
    validateAndSet([...brackets, { min: 0, rate: 0 }])
  }

  const handleRemoveBracket = (index) => {
    const newBrackets = brackets.filter((_, i) => i !== index)
    validateAndSet(newBrackets)
  }

  return (
    <div className="space-y-4">
      {brackets.map((bracket, index) => (
        <div key={index} className="grid grid-cols-4 gap-2 items-center">
          <label className="block">
            <span className="text-sm text-slate-600">Min</span>
            <input
              type="number"
              value={bracket.min}
              onChange={e => handleBracketChange(index, 'min', e.target.value)}
              className="w-full border rounded-md p-2"
            />
          </label>
          <label className="block">
            <span className="text-sm text-slate-600">Max (optional)</span>
            <input
              type="number"
              value={bracket.max ?? ''}
              onChange={e => handleBracketChange(index, 'max', e.target.value || null)}
              className="w-full border rounded-md p-2"
            />
          </label>
          <label className="block">
            <span className="text-sm text-slate-600">Rate (%)</span>
            <input
              type="number"
              value={bracket.rate * 100}
              onChange={e => handleBracketChange(index, 'rate', e.target.value)}
              className="w-full border rounded-md p-2"
              step="0.1"
              min="0"
              max="100"
            />
          </label>
          <button
            onClick={() => handleRemoveBracket(index)}
            className="bg-red-500 text-white px-3 py-2 rounded-md self-end"
          >
            Remove
          </button>
          {errors.some(err => err.index === index) && (
            <div className="col-span-4 text-red-500 text-xs mt-1">
              {errors.filter(err => err.index === index).map(err => (
                err.issues.map(issue => <p key={issue.path[0]}>{issue.message}</p>)
              ))}
            </div>
          )}
        </div>
      ))}
      <button
        onClick={handleAddBracket}
        className="bg-green-500 text-white px-4 py-2 rounded-md"
      >
        Add Bracket
      </button>
      {errors.length > 0 && (
        <div className="text-red-500 text-sm mt-2">
          Please fix the errors in the tax brackets.
        </div>
      )}
    </div>
  )
}
