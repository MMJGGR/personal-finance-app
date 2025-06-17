import React from 'react'

export function Card({ children, className = '', ...props }) {
  return (
    <div className={`shadow rounded-xl p-4 bg-white ${className}`} {...props}>
      {children}
    </div>
  )
}

export function CardHeader({ children, className = '', ...props }) {
  return (
    <div className={`flex justify-between items-center mb-2 ${className}`} {...props}>
      {children}
    </div>
  )
}

export function CardBody({ children, className = '', ...props }) {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  )
}
