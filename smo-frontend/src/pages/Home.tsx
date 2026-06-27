import { useState, useRef, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Navbar } from '../components/Navbar'
import QuestionCard from '../components/QuestionCard'
import { Sidebar } from '../components/Sidebar'
import { useAuth } from '../hooks/useAuth'
import type { QuestionSummary } from '../types'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string

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
    headers: { apikey: SUPABASE_KEY },
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

  const filter = searchParams.get('filter')
  const showMine = filter === 'mine'
  const showUnanswered = filter === 'unanswered'
  const search = searchParams.get('search') ?? ''
  const searchMode = searchParams.get('mode') === 'tags' ? 'tags' : 'questions'

  const [questions, setQuestions] = useState<QuestionSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set())

  const [sortMode, setSortMode] = useState<'top' | 'day' | 'week' | 'month' | 'year' | null>(null)
  const [recentOpen, setRecentOpen] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const recentRef = useRef<HTMLDivElement>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    fetchQuestions()
      .then(setQuestions)
      .catch((e) => setFetchError(e.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!user || !accessToken || questions.length === 0) return
    const ids = questions.map((q) => q.id).join(',')
    fetch(
      `${SUPABASE_URL}/rest/v1/votes?user_id=eq.${user.id}&target_type=eq.question&target_id=in.(${ids})&select=target_id`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${accessToken}` } }
    )
      .then((r) => r.json())
      .then((rows: { target_id: string }[]) => setVotedIds(new Set(rows.map((r) => r.target_id))))
      .catch(() => {})
  }, [user, accessToken, questions])

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (recentRef.current && !recentRef.current.contains(e.target as Node)) setRecentOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
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

  const periodDays: Record<string, number> = { day: 1, week: 7, month: 30, year: 365 }
  const cutoff = sortMode && sortMode !== 'top'
    ? new Date(Date.now() - periodDays[sortMode] * 86400000)
    : null

  const filtered = questions
    .filter((q) => {
      if (showMine) return q.author?.id === user?.id
      if (showUnanswered) return !q.is_solved
      if (cutoff && new Date(q.created_at) < cutoff) return false
      return searchMode === 'questions'
        ? q.title.toLowerCase().includes(search.toLowerCase())
        : q.question_tags.some((qt) => qt.tag.name.toLowerCase().includes(search.toLowerCase()))
    })
    .sort((a, b) => {
      if (sortMode === 'top') return b.vote_count - a.vote_count
      if (sortMode) return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      return 0
    })

  return (
    <div className="pt-14">
      <Navbar />
      <Sidebar />
      <div className="max-w-5xl mx-auto px-4 py-6 flex flex-col gap-4">

        <div className="flex items-center justify-between">
          {/* Sort toggle */}
          {!showMine && !showUnanswered && (
            <div className="flex items-center gap-2">
              <div className="relative" ref={recentRef}>
                <button
                  onClick={() => setRecentOpen((o) => !o)}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition ${sortMode && sortMode !== 'top' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  {sortMode && sortMode !== 'top'
                    ? { day: 'Last Day', week: 'Last Week', month: 'Last Month', year: 'Last Year' }[sortMode]
                    : 'Recent'}
                  <svg className={`w-3 h-3 transition-transform ${recentOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {recentOpen && (
                  <div className="absolute top-full left-0 mt-2 w-36 bg-white border border-gray-100 rounded-2xl shadow-lg overflow-hidden z-10">
                    {(['day', 'week', 'month', 'year'] as const).map((p, i, arr) => (
                      <div key={p}>
                        <button
                          onClick={() => { setSortMode(p); setRecentOpen(false) }}
                          className={`w-full text-left px-4 py-2.5 text-sm font-medium transition hover:bg-orange-50 ${sortMode === p ? 'text-orange-500' : 'text-gray-700'}`}
                        >
                          {{ day: 'Last Day', week: 'Last Week', month: 'Last Month', year: 'Last Year' }[p]}
                        </button>
                        {i < arr.length - 1 && <div className="h-px bg-gray-100" />}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={() => setSortMode(sortMode === 'top' ? null : 'top')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${sortMode === 'top' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                Top
              </button>
            </div>
          )}

          <button
            onClick={handleNewQuestion}
            className="ml-auto shrink-0 px-5 py-2 rounded-full bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 hover:shadow-md transition whitespace-nowrap"
          >
            + New
          </button>
        </div>

        {(showMine || showUnanswered) && (
          <div className="flex items-center justify-between bg-orange-50 border border-orange-200 rounded-2xl px-4 py-3">
            <span className="text-sm font-medium text-orange-600">
              {showMine ? 'Your Questions' : 'Unanswered Questions'}
            </span>
            <button onClick={() => navigate('/')} className="text-xs text-orange-400 hover:text-orange-600 font-medium transition">
              ✕ Go Back
            </button>
          </div>
        )}

        {loading && <div className="flex justify-center py-16 text-gray-400 text-sm">Loading questions…</div>}
        {fetchError && <div className="text-center py-16 text-red-500 text-sm">{fetchError}</div>}
        {!loading && !fetchError && filtered.length === 0 && (
          <div className="text-center py-16 text-gray-400 text-sm">No questions found.</div>
        )}
        {!loading && !fetchError && filtered.map((q) => (
          <QuestionCard key={q.id} question={q} voted={votedIds.has(q.id)} />
        ))}
      </div>

      {/* Login required toast */}
      <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ease-out ${showToast ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'}`}>
        <div className="bg-white rounded-xl px-5 py-3 text-sm font-medium text-red-600 border border-red-400 shadow-[0_0_18px_4px_rgba(239,68,68,0.3)] whitespace-nowrap">
          🔒 You need to be logged in to post
        </div>
      </div>
    </div>
  )
}

export default Home
