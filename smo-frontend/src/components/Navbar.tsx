import { useRef, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export function Navbar() {
  const navigate = useNavigate()
  const { user, username, logout } = useAuth()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Inchide dropdown-ul cand utilizatorul da click in afara lui
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    setDropdownOpen(false)
    try {
      await logout()
    } catch (e) {
      console.error('Logout error:', e)
    }
    navigate('/')
  }

  return (
    <header className="w-full border-b-4 border-orange-500 px-4 pt-5 pb-5 flex justify-between items-center">
      <span
        onClick={() => navigate('/')}
        className="text-4xl font-bold tracking-tight inline-block hover:-translate-y-2 transition-transform duration-150 cursor-pointer"
      >
        Stack_ <span className="text-orange-500">My_Overflow</span>
      </span>

      <div className="flex items-center gap-3">
        {user ? (
          <div className="relative" ref={dropdownRef}>
            {/* Buton username — click deschide dropdown */}
            <button
              onClick={() => setDropdownOpen((o) => !o)}
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-orange-500 text-orange-500 text-sm font-medium hover:bg-orange-50 transition select-none"
            >
              <span>👤</span>
              <span>{username ?? user.email}</span>
              {/* Sageata care se roteste cand e deschis */}
              <svg
                className={`w-3 h-3 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown */}
            <div className={`absolute right-0 mt-2 w-44 bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden z-50 transition-all duration-200 origin-top-right ${
              dropdownOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
            }`}>
              <button
                onClick={() => { setDropdownOpen(false); navigate('/?filter=mine') }}
                className="w-full text-left px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
              >
                Your Questions
              </button>
              <div className="h-px bg-gray-100" />
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 transition"
              >
                Log Out
              </button>
            </div>
          </div>
        ) : (
          <>
            <button onClick={() => navigate('/signin')} className="px-4 py-2 rounded-full border border-orange-500 text-orange-500 text-sm font-medium hover:bg-orange-50 transition">
              Log In
            </button>
            <button onClick={() => navigate('/signup')} className="px-4 py-2 rounded-full bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 transition">
              Sign Up
            </button>
          </>
        )}
      </div>
    </header>
  )
}
