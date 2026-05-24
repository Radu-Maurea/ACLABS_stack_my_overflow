import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { mockQuestions } from '../data/mockData'
import { Navbar } from '../components/Navbar'
import QuestionCard from '../components/QuestionCard'
import { useAuth } from '../hooks/useAuth'

function Home() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const [searchMode, setSearchMode] = useState<'questions' | 'tags'>('questions')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Clean up toast timer on unmount
  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current) }, [])

  const handleNewQuestion = () => {
    if (!user) {
      // Show the toast, reset its auto-dismiss timer each time
      setShowToast(true)
      if (toastTimer.current) clearTimeout(toastTimer.current)
      toastTimer.current = setTimeout(() => setShowToast(false), 3000)
      return
    }
    navigate('/questions/new')
  }

  const filtered = mockQuestions.filter((q) =>
    searchMode === 'questions'
      ? q.title.toLowerCase().includes(search.toLowerCase())
      : q.question_tags.some((qt) => qt.tag.name.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div>
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 py-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 flex-1 mr-3">
            <div className="relative shrink-0" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen((o) => !o)}
                className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 transition"
                title="Search filter"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="5" cy="12" r="2" />
                  <circle cx="12" cy="12" r="2" />
                  <circle cx="19" cy="12" r="2" />
                </svg>
              </button>
              <div className={`absolute top-full left-0 mt-2 w-44 bg-white border border-gray-100 rounded-2xl shadow-lg overflow-hidden z-10 transition-all duration-200 origin-top-left ${dropdownOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-0 pointer-events-none'}`}>
                <button
                  onClick={() => { setSearchMode('questions'); setDropdownOpen(false) }}
                  className={`w-full text-left px-4 py-3 text-sm font-medium transition hover:bg-orange-50 ${searchMode === 'questions' ? 'text-orange-500' : 'text-gray-700'}`}
                >
                  Search Questions
                </button>
                <div className="h-px bg-gray-100" />
                <button
                  onClick={() => { setSearchMode('tags'); setDropdownOpen(false) }}
                  className={`w-full text-left px-4 py-3 text-sm font-medium transition hover:bg-orange-50 ${searchMode === 'tags' ? 'text-orange-500' : 'text-gray-700'}`}
                >
                  Search Tags
                </button>
              </div>
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              placeholder={searchMode === 'questions' ? 'Search Question...' : 'Search Tags...'}
              className={`rounded-full px-6 py-3 bg-gray-100 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-300 transition-all duration-500 ease-in-out ${searchFocused || search ? 'flex-1' : 'w-48'}`}
            />
          </div>
          <button
            onClick={handleNewQuestion}
            className="shrink-0 px-5 py-3 rounded-full bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 hover:shadow-md transition whitespace-nowrap"
          >
            + New
          </button>
        </div>

        {filtered.map((q) => (
          <QuestionCard key={q.id} question={q} />
        ))}
      </div>

      {/* Login required toast */}
      <div
        className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ease-out ${
          showToast ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'
        }`}
      >
        <div className="bg-white rounded-xl px-5 py-3 text-sm font-medium text-red-600 border border-red-400 shadow-[0_0_18px_4px_rgba(239,68,68,0.3)] whitespace-nowrap">
          🔒 You need to be logged in to post
        </div>
      </div>
    </div>
  )
}

export default Home
