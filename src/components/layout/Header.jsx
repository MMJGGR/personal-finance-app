import React from 'react'
import UserMenu from './UserMenu.jsx'

export default function Header({ setActiveTab }) {
  return (
    <header className="bg-amber-400 h-14 flex items-center justify-between px-6 shadow">
      <h1 className="text-xl font-semibold leading-tight text-white">Personal Finance Planner</h1>
      <div className="flex items-center h-full space-x-4">
        <button
          onClick={() => setActiveTab('Preferences')}
          className="h-10 w-10 flex items-center justify-center bg-white rounded hover:bg-amber-300"
          aria-label="Preferences"
        >
          ⚙️
        </button>
        <UserMenu />
      </div>
    </header>
  )
}
