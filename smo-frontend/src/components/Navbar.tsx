import { useRef, useState, useEffect } from 'react'
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

type SearchMode = 'questions' | 'tags'

export function Navbar() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [searchParams] = useSearchParams()
  const { user, username, reputation, logout } = useAuth()

  const [search, setSearch] = useState(searchParams.get('search') ?? '')
  const [searchMode, setSearchMode] = useState<SearchMode>(
    searchParams.get('mode') === 'tags' ? 'tags' : 'questions'
  )
  const [modeOpen, setModeOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const dropdownRef = useRef<HTMLDivElement>(null)
  const modeRef = useRef<HTMLDivElement>(null)

  // Sync input when URL changes (e.g. clicking a tag navigates to /?search=...)
  useEffect(() => {
    setSearch(searchParams.get('search') ?? '')
    setSearchMode(searchParams.get('mode') === 'tags' ? 'tags' : 'questions')
  }, [searchParams])

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false)
      if (modeRef.current && !modeRef.current.contains(e.target as Node)) setModeOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  function buildUrl(value: string, mode: SearchMode) {
    const params = new URLSearchParams()
    if (value) params.set('search', value)
    if (mode === 'tags') params.set('mode', 'tags')
    const qs = params.toString()
    return qs ? `/?${qs}` : '/'
  }

  function handleSearch(value: string) {
    setSearch(value)
    navigate(buildUrl(value, searchMode), { replace: pathname === '/' })
  }

  function handleModeChange(mode: SearchMode) {
    setSearchMode(mode)
    setModeOpen(false)
    navigate(buildUrl(search, mode), { replace: pathname === '/' })
  }

  const handleLogout = async () => {
    setDropdownOpen(false)
    try { await logout() } catch (e) { console.error('Logout error:', e) }
    navigate('/')
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-white border-b-2 border-orange-500 flex items-center px-6 gap-4 shadow-sm">
      {/* Logo */}
      <span
        onClick={() => navigate('/')}
        className="text-lg font-bold tracking-tight cursor-pointer shrink-0 hover:opacity-75 transition-opacity whitespace-nowrap"
      >
        Stack_<span className="text-orange-500">My_Overflow</span>
      </span>

      {/* Search */}
      <div className="flex-1 max-w-2xl mx-auto flex items-center bg-gray-100 rounded-full px-4 py-2 gap-2 focus-within:ring-2 focus-within:ring-orange-300 focus-within:bg-white transition">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="m21 21-4.35-4.35" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder={searchMode === 'questions' ? 'Search questions...' : 'Search tags...'}
          className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 focus:outline-none min-w-0"
        />
        {/* Mode selector */}
        <div className="relative shrink-0" ref={modeRef}>
          <button
            onClick={() => setModeOpen((o) => !o)}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 font-medium transition px-1"
          >
            {searchMode === 'questions' ? 'Questions' : 'Tags'}
            <svg className={`w-3 h-3 transition-transform ${modeOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {modeOpen && (
            <div className="absolute right-0 top-full mt-3 w-36 bg-white border border-gray-100 rounded-2xl shadow-lg overflow-hidden z-50">
              <button onClick={() => handleModeChange('questions')} className={`w-full text-left px-4 py-2.5 text-sm font-medium transition hover:bg-orange-50 ${searchMode === 'questions' ? 'text-orange-500' : 'text-gray-700'}`}>
                Questions
              </button>
              <div className="h-px bg-gray-100" />
              <button onClick={() => handleModeChange('tags')} className={`w-full text-left px-4 py-2.5 text-sm font-medium transition hover:bg-orange-50 ${searchMode === 'tags' ? 'text-orange-500' : 'text-gray-700'}`}>
                Tags
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Auth */}
      <div className="flex items-center gap-2 shrink-0">
        {user ? (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen((o) => !o)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-orange-500 text-orange-500 text-sm font-medium hover:bg-orange-50 transition select-none"
            >
              <span>👤</span>
              <span>{username ?? user.email}</span>
              <svg className={`w-3 h-3 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div className={`absolute right-0 mt-2 w-44 bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden z-50 transition-all duration-200 origin-top-right ${dropdownOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
              <div className="px-4 py-3 flex items-center justify-between">
                <span className="text-xs text-gray-400">Reputație</span>
                <span className="text-xs font-semibold text-orange-500">{reputation ?? 0}</span>
              </div>
              <div className="h-px bg-gray-100" />
              <button onClick={() => { setDropdownOpen(false); navigate('/?filter=mine') }} className="w-full text-left px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
                Your Questions
              </button>
              <div className="h-px bg-gray-100" />
              <button onClick={handleLogout} className="w-full text-left px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 transition">
                Log Out
              </button>
            </div>
          </div>
        ) : (
          <>
            <button onClick={() => navigate('/signin')} className="px-4 py-1.5 rounded-full border border-orange-500 text-orange-500 text-sm font-medium hover:bg-orange-50 transition">
              Log In
            </button>
            <button onClick={() => navigate('/signup')} className="px-4 py-1.5 rounded-full bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 transition">
              Sign Up
            </button>
          </>
        )}
      </div>
    </header>
  )
}
