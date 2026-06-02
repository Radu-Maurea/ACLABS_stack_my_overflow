import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Navbar } from '../components/Navbar'
import { tagColor } from '../components/TagPill'
import { useAuth } from '../hooks/useAuth'
import { request } from '../lib/api'

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
  const { user, accessToken, refreshProfile } = useAuth()

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
      // Trimitem tot catre backend — el se ocupa de tags, question_tags si reputatie (+15)
      await request('/questions', {
        method: 'POST',
        body: JSON.stringify({ title: title.trim(), description: description.trim(), tags: finalTags }),
      }, accessToken)

      // Navigam imediat la home, refresh profilului ruleaza in fundal
      navigate('/')
      refreshProfile().catch(() => {})
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
