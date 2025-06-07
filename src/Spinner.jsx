// src/Spinner.jsx
import React from 'react'

export default function Spinner() {
  return (
    <div className="flex justify-center items-center py-6" role="status">
      <div className="h-6 w-6 border-4 border-amber-700 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}
