import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import type { Question, Answer, Comment } from '../types'
import { TagPill, tagColor } from '../components/TagPill'
import { Upvote } from '../components/Upvote'
import { Status } from '../components/Status'
import { Navbar } from '../components/Navbar'
import { AnswerEditor } from '../components/AnswerEditor'
import { formatDate } from '../lib/utils'
import { useAuth } from '../hooks/useAuth'
import { request } from '../lib/api'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string
const SMO_AI_USER_ID = import.meta.env.VITE_SMO_AI_USER_ID as string

function publicFetch(path: string) {
  return fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    headers: { apikey: SUPABASE_KEY },
  })
}

async function fetchQuestion(id: string): Promise<Question | null> {
  const select = [
    'id', 'title', 'description', 'author_id', 'is_solved', 'vote_count', 'created_at',
    'author:profiles(id,username)',
    'question_tags(tag:tags(name))',
    'answers(id,body,author_id,vote_count,is_accepted,created_at,author:profiles(id,username))',
  ].join(',')

  const res = await publicFetch(`/questions?id=eq.${id}&select=${select}&limit=1`)
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Eroare la incarcarea intrebarii (${res.status}): ${body}`)
  }

  const rows = await res.json()
  if (!rows.length) return null
  const q = rows[0]

  let questionComments: Comment[] = []
  try {
    const cRes = await publicFetch(
      `/comments?target_type=eq.question&target_id=eq.${id}&select=id,body,target_id,target_type,created_at,author:profiles(username)`
    )
    if (cRes.ok) questionComments = await cRes.json()
  } catch { /* tabela comments poate sa nu existe inca */ }

  const answerIds: string[] = (q.answers ?? []).map((a: { id: string }) => a.id)
  let answerComments: Comment[] = []
  if (answerIds.length > 0) {
    try {
      const acRes = await publicFetch(
        `/comments?target_type=eq.answer&target_id=in.(${answerIds.join(',')})&select=id,body,target_id,target_type,created_at,author:profiles(username)`
      )
      if (acRes.ok) answerComments = await acRes.json()
    } catch { /* ignore */ }
  }

  return {
    id: q.id, title: q.title, description: q.description, author_id: q.author_id,
    is_solved: q.is_solved, vote_count: q.vote_count, created_at: q.created_at,
    author: q.author ?? null, question_tags: q.question_tags ?? [], comments: questionComments,
    answers: (q.answers ?? []).map((a: {
      id: string; body: string; author_id: string; vote_count: number
      is_accepted: boolean; created_at: string
      author: { id: string; username: string } | null
    }) => ({ ...a, question_id: id, comments: answerComments.filter((c) => c.target_id === a.id) })),
  }
}

function QuestionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user, accessToken } = useAuth()
  const [question, setQuestion] = useState<Question | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set())

  const [answerBody, setAnswerBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const [menuOpen, setMenuOpen] = useState(false)
  const [editingTags, setEditingTags] = useState(false)
  const [editTags, setEditTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [savingTags, setSavingTags] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    setError(null)
    fetchQuestion(id)
      .then((q) => { if (!q) setError('not_found'); else setQuestion(q) })
      .catch((e: Error) => { console.error('QuestionDetail fetch error:', e); setError(e.message) })
      .finally(() => setLoading(false))
  }, [id])

  // Dupa ce avem intrebarea si userul logat, aducem voturile sale pentru intrebare + raspunsuri
  useEffect(() => {
    if (!user || !accessToken || !question) return
    const targets = [question.id, ...question.answers.map((a) => a.id)]
    fetch(
      `${SUPABASE_URL}/rest/v1/votes?user_id=eq.${user.id}&target_id=in.(${targets.join(',')})&select=target_id`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${accessToken}` } }
    )
      .then((r) => r.json())
      .then((rows: { target_id: string }[]) => setVotedIds(new Set(rows.map((r) => r.target_id))))
      .catch(() => {})
  }, [user, accessToken, question])

  useEffect(() => {
    if (!menuOpen) return
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [menuOpen])

  function openTagEditor() {
    setEditTags(question?.question_tags.map((qt) => qt.tag.name) ?? [])
    setTagInput('')
    setEditingTags(true)
    setMenuOpen(false)
  }

  function addEditTag(raw: string) {
    const normalized = raw.trim().toLowerCase().replace(/\s+/g, '-')
    if (normalized && !editTags.includes(normalized) && editTags.length < 5) {
      setEditTags((prev) => [...prev, normalized])
    }
    setTagInput('')
  }

  function handleTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addEditTag(tagInput) }
  }

  async function handleSaveTags() {
    if (!id || !accessToken) return
    setSavingTags(true)
    try {
      const finalTags = tagInput.trim() ? [...new Set([...editTags, tagInput.trim().toLowerCase().replace(/\s+/g, '-')])] : editTags
      await request(`/questions/${id}/tags`, {
        method: 'PATCH',
        body: JSON.stringify({ tags: finalTags }),
      }, accessToken)
      setQuestion((prev) => prev ? {
        ...prev,
        question_tags: finalTags.map((name) => ({ tag: { name } })),
      } : prev)
      setEditingTags(false)
      setTagInput('')
    } catch { /* ignore */ } finally {
      setSavingTags(false)
    }
  }

  async function handleAccept(answerId: string) {
    if (!accessToken) return
    try {
      const res = await request<{ is_accepted: boolean; is_solved: boolean }>(
        `/answers/${answerId}/accept`,
        { method: 'PATCH' },
        accessToken
      )
      setQuestion((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          is_solved: res.is_solved,
          answers: prev.answers.map((a) => ({
            ...a,
            is_accepted: a.id === answerId ? res.is_accepted : false,
          })),
        }
      })
    } catch { /* ignore */ }
  }

  async function handlePostAnswer() {
    if (!answerBody.trim() || !id) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      const newAnswer = await request<Answer>('/answers', {
        method: 'POST',
        body: JSON.stringify({ question_id: id, body: answerBody.trim() }),
      }, accessToken)

      // Adaugam raspunsul nou in lista fara sa reincarcam pagina
      setQuestion((prev) => prev ? {
        ...prev,
        answers: [...prev.answers, { ...newAnswer, comments: [] }],
      } : prev)
      setAnswerBody('')
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Eroare la postarea raspunsului.'
      setSubmitError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return (
    <div className="pt-14"><Navbar />
      <div className="flex justify-center items-center py-32 text-gray-400 text-sm">Se incarca intrebarea...</div>
    </div>
  )

  if (error === 'not_found' || !question) return (
    <div className="pt-14"><Navbar />
      <div className="max-w-3xl mx-auto p-6 text-gray-500">Intrebarea nu a fost gasita.</div>
    </div>
  )

  if (error) return (
    <div className="pt-14"><Navbar />
      <div className="max-w-3xl mx-auto p-6 text-red-500">{error}</div>
    </div>
  )

  return (
    <div className="pt-14">
      <Navbar />
      <div className="max-w-5xl mx-auto px-10 py-6">

        {/* Intrebare */}
        <div className="bg-gray-50 rounded-2xl p-6 mb-3">
          <div className="flex items-start justify-between gap-2 mb-3">
            {/* Taguri — view sau edit mode */}
            {editingTags ? (
              <div className="flex-1">
                <div className="rounded-xl px-4 py-2 bg-white border border-orange-300 flex flex-wrap gap-2 items-center focus-within:ring-2 focus-within:ring-orange-300 transition">
                  {editTags.map((tag) => (
                    <span key={tag} className={`flex items-center gap-1 text-xs font-medium pl-3 pr-2 py-1 rounded-full ${tagColor(tag)}`}>
                      {tag}
                      <button
                        type="button"
                        onClick={() => setEditTags((prev) => prev.filter((t) => t !== tag))}
                        className="hover:opacity-60 transition-opacity font-bold leading-none"
                      >×</button>
                    </span>
                  ))}
                  {editTags.length < 5 && (
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleTagKeyDown}
                      placeholder={editTags.length === 0 ? 'e.g. javascript, react' : ''}
                      className="flex-1 min-w-[120px] bg-transparent text-sm text-gray-800 placeholder-gray-400 focus:outline-none"
                      autoFocus
                    />
                  )}
                </div>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={handleSaveTags}
                    disabled={savingTags}
                    className="px-4 py-1.5 rounded-full bg-orange-500 text-white text-xs font-medium hover:bg-orange-600 disabled:bg-orange-300 transition"
                  >
                    {savingTags ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={() => { setEditingTags(false); setTagInput('') }}
                    className="px-4 py-1.5 rounded-full bg-gray-100 text-gray-600 text-xs font-medium hover:bg-gray-200 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2 flex-wrap">
                {question.question_tags.map((qt) => (
                  <TagPill key={qt.tag.name} name={qt.tag.name} />
                ))}
              </div>
            )}

            {/* Three-dots menu — vizibil doar autorului */}
            {user?.id === question.author_id && !editingTags && (
              <div className="relative shrink-0" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition"
                  aria-label="Question options"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <circle cx="10" cy="4" r="1.5" />
                    <circle cx="10" cy="10" r="1.5" />
                    <circle cx="10" cy="16" r="1.5" />
                  </svg>
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-xl shadow-lg z-10 py-1 min-w-[130px]">
                    <button
                      onClick={openTagEditor}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
                    >
                      Edit tags
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <p className="text-lg font-semibold text-black mb-3">{question.title}</p>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{question.description}</p>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <Upvote count={question.vote_count} targetId={question.id} targetType="question" voted={votedIds.has(question.id)} />
          <Status solved={question.is_solved} />
          <span className="text-xs text-gray-500 ml-auto">
            Intrebare de <span className="font-medium text-gray-700">{question.author?.username ?? 'Anonim'}</span>
            {' · '}{formatDate(question.created_at)}
          </span>
        </div>

        {question.comments.length > 0 && (
          <div className="mb-6 flex flex-col gap-2 border-t pt-4">
            {question.comments.map((c) => (
              <p key={c.id} className="text-xs text-gray-500">
                {c.body} — <span className="font-medium">{c.author?.username ?? 'Anonim'}</span>
              </p>
            ))}
          </div>
        )}

        <p className="text-lg text-black font-semibold mb-4 pb-2">
          {question.answers.length} {question.answers.length === 1 ? 'Raspuns' : 'Raspunsuri'}
        </p>

        <div className="flex flex-col gap-4">
          {question.answers.map((a) => (
            <div key={a.id} className={`border rounded-lg p-6 shadow-sm transition-shadow ${
                a.is_accepted
                  ? 'border-green-400 bg-green-50/30'
                  : a.author_id === SMO_AI_USER_ID
                    ? 'border-orange-200 bg-orange-50/20 shadow-[0_0_18px_rgba(251,146,60,0.2)]'
                    : ''
              }`}>
              {a.author_id === SMO_AI_USER_ID && (
                <>
                  <p className="text-xs font-bold mb-2 text-orange-400 drop-shadow-[0_0_6px_rgba(251,146,60,0.8)] tracking-wide">
                    ✦ AI BOT ANSWERED:
                  </p>
                  <hr className="border-orange-200 mb-4" />
                </>
              )}
              <p className="text-gray-700 text-sm mb-4 whitespace-pre-wrap">{a.body}</p>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <Upvote count={a.vote_count} targetId={a.id} targetType="answer" voted={votedIds.has(a.id)} />

                {/* Buton accept — vizibil doar autorului intrebarii */}
                {user?.id === question.author_id && (
                  <button
                    onClick={() => handleAccept(a.id)}
                    className={`group px-3 py-1 rounded-full text-xs font-medium transition ${
                      a.is_accepted
                        ? 'bg-green-100 text-green-700 hover:bg-red-50 hover:text-red-500'
                        : 'bg-gray-100 text-gray-500 hover:bg-green-50 hover:text-green-600'
                    }`}
                  >
                    {a.is_accepted ? (
                      <>
                        <span className="group-hover:hidden">✓ Acceptat</span>
                        <span className="hidden group-hover:inline">✕ Retrage</span>
                      </>
                    ) : (
                      '✓ Accepta'
                    )}
                  </button>
                )}

                {/* Badge readonly pentru ceilalti utilizatori */}
                {a.is_accepted && user?.id !== question.author_id && (
                  <span className="text-xs font-medium px-3 py-1 rounded-full" style={{ backgroundColor: '#e8f0e1', color: '#5B7E3C' }}>
                    ✓ Acceptat
                  </span>
                )}

                <span className="ml-auto">
                  Raspuns de <span className="font-medium text-gray-700">{a.author?.username ?? 'Anonim'}</span>
                  {' · '}{formatDate(a.created_at)}
                </span>
              </div>
              {a.comments.length > 0 && (
                <div className="mt-4 border-t pt-4 flex flex-col gap-2">
                  {a.comments.map((c) => (
                    <p key={c.id} className="text-xs text-gray-500">
                      {c.body} — <span className="font-medium">{c.author?.username ?? 'Anonim'}</span>
                    </p>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8">
          <p className="text-lg font-semibold text-black mb-3 pb-2">Raspunsul tau</p>

          {user ? (
            <>
              <AnswerEditor value={answerBody} onChange={setAnswerBody} />

              {submitError && (
                <p className="mt-2 text-sm text-red-500">{submitError}</p>
              )}

              <button
                onClick={handlePostAnswer}
                disabled={submitting || !answerBody.trim()}
                className="mt-3 px-6 py-2 rounded-full bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 disabled:bg-orange-300 disabled:cursor-not-allowed transition"
              >
                {submitting ? 'Se posteaza...' : 'Posteaza raspuns'}
              </button>
            </>
          ) : (
            <div className="rounded-2xl border border-gray-200 px-6 py-8 text-center text-sm text-gray-500">
              Trebuie să fii{' '}
              <a href="/signin" className="text-orange-500 font-medium hover:underline">logat</a>
              {' '}pentru a răspunde.
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

export default QuestionDetailPage
