import { useState, useRef, useEffect } from 'react'
import { mockQuestions } from './data/mockData'
import { BrowserRouter, Routes, Route, useParams } from 'react-router-dom'
import SignIn from './pages/SignIn'
import Signup from './pages/Signup'
import QuestionCard from './components/QuestionCard'
import QuestionDetail from './components/QuestionDetail'
import { Header } from './components/Header'
import { mockQuestionDetails } from './data/mockDataDetail.ts'

function Home() {
  const [search, setSearch] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const [searchMode, setSearchMode] = useState<'questions' | 'tags'>('questions')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filtered = mockQuestions.filter((q) =>
    searchMode === 'questions'
      ? q.title.toLowerCase().includes(search.toLowerCase())
      : q.question_tags.some((qt) => qt.tag.name.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div>
      <Header />

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
          <button className="shrink-0 px-5 py-3 rounded-full bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 hover:shadow-md transition whitespace-nowrap">
            + New
          </button>
        </div>

        {filtered.map((q) => (
          <QuestionCard key={q.id} question={q} />
        ))}
      </div>
    </div>
  )
}

function QuestionDetailPage() {

  
  const { id } = useParams()
  const question = mockQuestionDetails.find((q) => q.id === id)

  if (!question) {
    return <div className="max-w-3xl mx-auto p-6 text-gray-500">Question not found.</div>
  }

  return <QuestionDetail question={question} />
}

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-white">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/question/:id" element={<QuestionDetailPage />} />
      </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App