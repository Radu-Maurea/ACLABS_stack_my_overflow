import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Navbar } from '../components/Navbar'
import { tagColor } from '../components/TagPill'
import { useAuth } from '../hooks/useAuth'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string

function RemovableTag({ name, onRemove }: { name: string; onRemove: () => void }) {
  return (
    <span className={`flex items-center gap-1 text-xs font-medium pl-3 pr-2 py-1 rounded-full ${tagColor(name)}`}>
      {name}
      <button
        type="button"
        onClick={onRemove}
        className="hover:opacity-60 transition-opacity font-bold leading-none"
      >
        ×
      </button>
    </span>
  )
}

function AskQuestion() {
  const navigate = useNavigate()
  const { user, accessToken } = useAuth()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [errors, setErrors] = useState<{ title?: string; description?: string; general?: string }>({})
  const [submitting, setSubmitting] = useState(false)

  function normalizeTag(raw: string) {
    return raw.trim().toLowerCase().replace(/\s+/g, '-')
  }

  function addTag(raw: string) {
    const normalized = normalizeTag(raw)
    if (normalized && !tags.includes(normalized) && tags.length < 5) {
      setTags((prev) => [...prev, normalized])
    }
    setTagInput('')
  }

  function handleTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(tagInput)
    }
  }

  // Authenticated fetch helper — uses the stored token, never calls getSession()
  function dbFetch(path: string, options: RequestInit = {}) {
    return fetch(`${SUPABASE_URL}/rest/v1${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${accessToken}`,
        ...(options.headers ?? {}),
      },
    })
  }

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault()

    if (!user || !accessToken) {
      navigate('/signin')
      return
    }

    const finalTags = tagInput.trim()
      ? [...new Set([...tags, normalizeTag(tagInput)])]
      : tags

    const newErrors: typeof errors = {}
    if (!title.trim()) newErrors.title = 'Title is required.'
    if (description.trim().length < 20) newErrors.description = 'Description must be at least 20 characters.'
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return }

    setErrors({})
    setTagInput('')
    setSubmitting(true)

    try {
      const questionId = crypto.randomUUID()

      // 1. Insert the question
      const qRes = await dbFetch('/questions', {
        method: 'POST',
        headers: { 'Prefer': 'return=minimal' },
        body: JSON.stringify({
          id: questionId,
          title: title.trim(),
          description: description.trim(),
          author_id: user.id,
        }),
      })
      if (!qRes.ok) {
        const body = await qRes.text()
        throw new Error(`Failed to post question (${qRes.status}): ${body}`)
      }

      // 2. For each tag: insert (ignore conflict) → fetch id → link to question
      for (const tagName of finalTags) {
        // Insert tag — on_conflict=name silently ignores duplicates (no 409)
        await dbFetch('/tags?on_conflict=name', {
          method: 'POST',
          headers: { 'Prefer': 'return=minimal,resolution=ignore-duplicates' },
          body: JSON.stringify({ name: tagName }),
        })

        // Fetch tag id by name
        const tRes = await dbFetch(`/tags?name=eq.${encodeURIComponent(tagName)}&select=id`)
        if (!tRes.ok) throw new Error(`Failed to fetch tag (${tRes.status})`)
        const tagRows: { id: string }[] = await tRes.json()
        if (!tagRows.length) throw new Error(`Tag not found after insert: ${tagName}`)

        // Link tag to question
        const qtRes = await dbFetch('/question_tags', {
          method: 'POST',
          headers: { 'Prefer': 'return=minimal' },
          body: JSON.stringify({ question_id: questionId, tag_id: tagRows[0].id }),
        })
        if (!qtRes.ok) {
          const body = await qtRes.text()
          throw new Error(`Failed to link tag (${qtRes.status}): ${body}`)
        }
      }

      navigate('/')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong.'
      setErrors({ general: msg })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-10">
        <p className="text-2xl font-bold text-black mb-8">Ask a Question</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">

          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-black">Title</label>
            <p className="text-xs text-gray-500 mb-1">Be specific and imagine you're asking a question to another person.</p>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. How do I center a div in CSS?"
              className="rounded-xl px-4 py-3 bg-gray-50 border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-300 transition"
            />
            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-black">Description</label>
            <p className="text-xs text-gray-500 mb-1">Include all the information someone would need to answer your question</p>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your problem in detail. What have you already tried? What did you expect to happen?"
              rows={6}
              className="rounded-xl px-4 py-3 bg-gray-50 border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-300 transition resize-none"
            />
            {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-black">Tags</label>
            <p className="text-xs text-gray-500 mb-1">Add up to 5 tags. Press Enter or comma to add.</p>
            <div className="rounded-xl px-4 py-3 bg-gray-50 border border-gray-200 focus-within:ring-2 focus-within:ring-orange-300 transition flex flex-wrap gap-2 items-center">
              {tags.map((tag) => (
                <RemovableTag
                  key={tag}
                  name={tag}
                  onRemove={() => setTags((prev) => prev.filter((t) => t !== tag))}
                />
              ))}
              {tags.length < 5 && (
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  placeholder={tags.length === 0 ? 'e.g. javascript, react, css' : ''}
                  className="flex-1 min-w-[120px] bg-transparent text-sm text-gray-800 placeholder-gray-400 focus:outline-none"
                />
              )}
            </div>
          </div>

          {errors.general && (
            <p className="text-sm text-red-500 text-center">{errors.general}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="self-start px-6 py-3 rounded-full bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 hover:shadow-md disabled:bg-orange-300 transition"
          >
            {submitting ? 'Posting...' : 'Post your question'}
          </button>

        </form>
      </div>
    </div>
  )
}

export default AskQuestion
