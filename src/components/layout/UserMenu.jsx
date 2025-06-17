import React, { useState, useRef, useEffect } from 'react'

export default function UserMenu() {
  const [open, setOpen] = useState(false)
  const ref = useRef()

  useEffect(() => {
    const handleClickOutside = e => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  return (
    <div ref={ref} className="relative h-full flex items-center">
      <button
        onClick={() => setOpen(o => !o)}
        className="h-10 px-4 bg-white text-amber-600 rounded hover:bg-amber-50"
      >
        Menu
      </button>
      {open && (
        <ul className="absolute right-0 top-full mt-1 w-48 bg-white shadow-lg rounded">
          {['Notifications', 'Help & Support', 'Logout'].map(item => (
            <li key={item}>
              <button className="w-full text-left px-4 py-2 text-amber-600 hover:bg-amber-50">
                {item}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
