import React, { useState } from 'react'

export default function Tooltip({ children, content }) {
  const [show, setShow] = useState(false)

  return (
    <div className="relative flex items-center">
      {children}
      <span
        className="ml-2 text-gray-400 cursor-help"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
      >
        &#9432; {/* Unicode Information Symbol */}
      </span>
      {show && (
        <div className="absolute z-10 px-3 py-2 text-sm font-medium text-white bg-gray-700 rounded-lg shadow-sm top-full left-1/2 -translate-x-1/2 mt-2 whitespace-nowrap">
          {content}
          <div className="absolute text-gray-700 text-sm top-[-6px] left-1/2 -translate-x-1/2 transform rotate-45 w-3 h-3 bg-gray-700"></div>
        </div>
      )}
    </div>
  )
}
