import React, { useState } from 'react'

function UserMenu() {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)} className="px-3 py-1 bg-white text-amber-400 rounded-md">
        Menu
      </button>
      {open && (
        <ul className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-md">
          {['Notifications','Help & Support','Logout / Switch User'].map(item => (
            <li key={item}>
              <button className="w-full text-left px-4 py-2 text-amber-400 hover:bg-amber-50">{item}</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function Header({ setActiveTab }) {
  return (
    <header className="bg-amber-400 text-white p-4 flex items-center justify-between">
      <h1 className="text-2xl font-bold">Personal Finance Planner</h1>
      <div className="flex items-center space-x-2">
        <button
          id="preferences-button"
          onClick={() => setActiveTab('Preferences')}
          aria-label="Preferences"
          className="p-2 rounded hover:bg-amber-300"
        >
          ⚙️
        </button>
        <UserMenu />
      </div>
    </header>
  )
}

export { UserMenu }
