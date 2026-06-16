import { useState, useRef, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Navbar } from '../components/Navbar'
import QuestionCard from '../components/QuestionCard'
import { Sidebar } from '../components/Sidebar'
import { useAuth } from '../hooks/useAuth'
import type { QuestionSummary } from '../types'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string

// Raw DB row shape returned by PostgREST
type DBQuestion = {
  id: string
  title: string
  is_solved: boolean
  vote_count: number
  created_at: string
  author: { id: string; username: string } | null
  question_tags: { tag: { name: string } }[]
  answers: { id: string }[]
}

async function fetchQuestions(): Promise<QuestionSummary[]> {
  const params = new URLSearchParams({
    select: 'id,title,is_solved,vote_count,created_at,author:profiles(id,username),question_tags(tag:tags(name)),answers(id)',
    order: 'created_at.desc',
  })

  const res = await fetch(`${SUPABASE_URL}/rest/v1/questions?${params}`, {
    headers: { 'apikey': SUPABASE_KEY },
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Failed to load questions (${res.status}): ${body}`)
  }

  const rows: DBQuestion[] = await res.json()

  return rows.map((q) => ({
    id: q.id,
    title: q.title,
    is_solved: q.is_solved,
    vote_count: q.vote_count,
    created_at: q.created_at,
    author: q.author ?? null,
    question_tags: q.question_tags ?? [],
    answer_count: q.answers?.length ?? 0,
  }))
}

function Home() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user, accessToken } = useAuth()

  // true cand URL-ul contine ?filter=mine
  const showMine = searchParams.get('filter') === 'mine'

  const [questions, setQuestions] = useState<QuestionSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set())

  const [search, setSearch] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const [searchMode, setSearchMode] = useState<'questions' | 'tags'>('questions')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load questions from DB on mount
  useEffect(() => {
    fetchQuestions()
      .then(setQuestions)
      .catch((e) => setFetchError(e.message))
      .finally(() => setLoading(false))
  }, [])

  // Dupa ce avem intrebarile SI userul logat, aducem voturile lui
  useEffect(() => {
    if (!user || !accessToken || questions.length === 0) return
    const ids = questions.map((q) => q.id).join(',')
    fetch(
      `${SUPABASE_URL}/rest/v1/votes?user_id=eq.${user.id}&target_type=eq.question&target_id=in.(${ids})&select=target_id`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${accessToken}` } }
    )
      .then((r) => r.json())
      .then((rows: { target_id: string }[]) =>
        setVotedIds(new Set(rows.map((r) => r.target_id)))
      )
      .catch(() => {}) // voturile sunt optionale, nu blocam UI-ul
  }, [user, accessToken, questions])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current) }, [])

  const handleNewQuestion = () => {
    if (!user) {
      setShowToast(true)
      if (toastTimer.current) clearTimeout(toastTimer.current)
      toastTimer.current = setTimeout(() => setShowToast(false), 3000)
      return
    }
    navigate('/questions/new')
  }

  const filtered = questions.filter((q) => {
    // Daca e activ filtrul "Intrebarile mele", aratam doar intrebarile userului logat
    if (showMine) return q.author?.id === user?.id

    // Altfel, filtram dupa text (titlu sau tag)
    return searchMode === 'questions'
      ? q.title.toLowerCase().includes(search.toLowerCase())
      : q.question_tags.some((qt) => qt.tag.name.toLowerCase().includes(search.toLowerCase()))
  })

  return (
    <div>
      <Navbar />

      <Sidebar />
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

        {/* Banner "Intrebarile mele" activ */}
        {showMine && (
          <div className="flex items-center justify-between bg-orange-50 border border-orange-200 rounded-2xl px-4 py-3">
            <span className="text-sm font-medium text-orange-600">Your Questions</span>
            <button
              onClick={() => navigate('/')}
              className="text-xs text-orange-400 hover:text-orange-600 font-medium transition"
            >
              ✕ Go Back
            </button>
          </div>
        )}

        {/* Question list */}
        {loading && (
          <div className="flex justify-center py-16 text-gray-400 text-sm">Loading questions…</div>
        )}
        {fetchError && (
          <div className="text-center py-16 text-red-500 text-sm">{fetchError}</div>
        )}
        {!loading && !fetchError && filtered.length === 0 && (
          <div className="text-center py-16 text-gray-400 text-sm">No questions found.</div>
        )}
        {!loading && !fetchError && filtered.map((q) => (
          <QuestionCard key={q.id} question={q} voted={votedIds.has(q.id)} />
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
