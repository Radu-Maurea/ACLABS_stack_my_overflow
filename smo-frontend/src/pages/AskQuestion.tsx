import { useState } from 'react'
import { Navbar } from '../components/Navbar'
import { tagColor } from '../components/TagPill'

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
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [errors, setErrors] = useState<{ title?: string; description?: string }>({})

  function normalizeTag(raw: string) {
    return raw.trim().toLowerCase().replace(/\s+/g, '-')
  }

  function addTag(raw: string) {
    const normalized = normalizeTag(raw)
    if (normalized && !tags.includes(normalized)) {
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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const finalTags = tagInput.trim() ? [...new Set([...tags, normalizeTag(tagInput)])] : tags
    const newErrors: { title?: string; description?: string } = {}
    if (!title.trim()) newErrors.title = 'Title is required.'
    if (description.trim().length < 20) newErrors.description = 'Description must be at least 20 characters.'
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    setErrors({})
    setTagInput('')
    console.log({ title, description, tags: finalTags })
  }

  return (
    <div>
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-10">
        <p className="text-2xl font-bold text-black mb-8">Ask a Question</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">

          {/* Title */}
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

          {/* Description */}
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
            <label className="text-sm font-semibold text-black">Tags</label>
            <p className="text-xs text-gray-500 mb-1">Add up to 5 tags. Press Enter or comma to add.</p>
            <div className="rounded-xl px-4 py-3 bg-gray-50 border border-gray-200 focus-within:ring-2 focus-within:ring-orange-300 transition flex flex-wrap gap-2 items-center">
              {tags.map((tag) => (
                <RemovableTag key={tag} name={tag} onRemove={() => setTags((prev) => prev.filter((t) => t !== tag))} />
              ))}
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder={tags.length === 0 ? 'e.g. javascript, react, css' : ''}
                className="flex-1 min-w-[120px] bg-transparent text-sm text-gray-800 placeholder-gray-400 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            className="self-start px-6 py-3 rounded-full bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 hover:shadow-md transition"
          >
            Post your question
          </button>

        </form>
      </div>
    </div>
  )
}

export default AskQuestion
