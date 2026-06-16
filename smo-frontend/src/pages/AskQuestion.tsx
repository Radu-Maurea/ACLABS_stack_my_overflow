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

function Toggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`relative inline-flex h-6 w-10 items-center rounded-full transition-colors focus:outline-none ${
        enabled ? 'bg-orange-500' : 'bg-gray-300'
      }`}
      aria-pressed={enabled}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
        enabled ? 'translate-x-5' : 'translate-x-1'
      }`} />
    </button>
  )
}

function AskQuestion() {
  const navigate = useNavigate()
  const { user, accessToken, refreshProfile } = useAuth()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [aiTagsEnabled, setAiTagsEnabled] = useState(false)
  const [aiAnswerEnabled, setAiAnswerEnabled] = useState(false)
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
      const question = await request<{ id: string }>('/questions', {
        method: 'POST',
        body: JSON.stringify(
          aiTagsEnabled
            ? { title: title.trim(), description: description.trim(), useAiTags: true }
            : { title: title.trim(), description: description.trim(), tags: finalTags }
        ),
      }, accessToken)

      // Daca AI answer e activat, trimitem cererea dupa ce avem ID-ul intrebarii
      if (aiAnswerEnabled) {
        try {
          await request(`/questions/${question.id}/ai-answer`, { method: 'POST' }, accessToken)
        } catch { /* eroare la AI answer — navigam oricum la intrebare */ }
      }

      refreshProfile().catch(() => {})
      // Navigam la intrebarea postata (nu la home) ca sa se vada eventualul raspuns AI
      navigate(`/question/${question.id}`)
    } catch (err: unknown) {
      const msg = (err as { error?: string })?.error ?? (err instanceof Error ? err.message : 'Something went wrong.')
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

          {/* Tags */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between mb-1">
              <div>
                <label className="text-sm font-semibold text-black">Tags</label>
                {!aiTagsEnabled && (
                  <p className="text-xs text-gray-500 mt-0.5">Add up to 5 tags. Press Enter or comma to add.</p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-gray-500">AI tags</span>
                <Toggle enabled={aiTagsEnabled} onToggle={() => setAiTagsEnabled((v) => !v)} />
              </div>
            </div>

            {aiTagsEnabled ? (
              <div className="rounded-xl px-4 py-3 bg-orange-50 border border-orange-200 flex items-center gap-2 text-sm text-orange-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2a1 1 0 0 1 .894.553l2.382 4.826 5.327.774a1 1 0 0 1 .554 1.706l-3.855 3.757.91 5.306a1 1 0 0 1-1.451 1.054L12 17.527l-4.761 2.449a1 1 0 0 1-1.451-1.054l.91-5.306L2.843 9.859a1 1 0 0 1 .554-1.706l5.327-.774L11.106 2.553A1 1 0 0 1 12 2z"/>
                </svg>
                AI will automatically generate tags based on your question
              </div>
            ) : (
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
            )}
          </div>

          {/* AI Answer */}
          <div className={`flex items-center justify-between rounded-xl px-4 py-3 border transition-colors ${
            aiAnswerEnabled ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex items-center gap-2">
              {aiAnswerEnabled && (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0 text-orange-700" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2a1 1 0 0 1 .894.553l2.382 4.826 5.327.774a1 1 0 0 1 .554 1.706l-3.855 3.757.91 5.306a1 1 0 0 1-1.451 1.054L12 17.527l-4.761 2.449a1 1 0 0 1-1.451-1.054l.91-5.306L2.843 9.859a1 1 0 0 1 .554-1.706l5.327-.774L11.106 2.553A1 1 0 0 1 12 2z"/>
                </svg>
              )}
              <div>
                <p className={`text-sm font-semibold transition-colors ${aiAnswerEnabled ? 'text-orange-700' : 'text-black'}`}>AI Answer</p>
                <p className={`text-xs mt-0.5 transition-colors ${aiAnswerEnabled ? 'text-orange-500' : 'text-gray-500'}`}>Let SMO Bot generate an answer when you post</p>
              </div>
            </div>
            <Toggle enabled={aiAnswerEnabled} onToggle={() => setAiAnswerEnabled((v) => !v)} />
          </div>

          {errors.general && (
            <p className="text-sm text-red-500 text-center">{errors.general}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="self-start px-6 py-3 rounded-full bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 hover:shadow-md disabled:bg-orange-300 transition"
          >
            {submitting ? (aiAnswerEnabled ? 'Posting & generating answer...' : 'Posting...') : 'Post your question'}
          </button>

        </form>
      </div>
    </div>
  )
}

export default AskQuestion
