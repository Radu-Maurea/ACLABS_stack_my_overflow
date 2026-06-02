import { useRef, useState, useEffect } from 'react'
import { codeToHtml } from 'shiki'

function ToolbarButton({ onClick, title, children }: { onClick: () => void; title: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-600 hover:bg-orange-50 hover:text-orange-500 transition-colors text-sm font-medium"
    >
      {children}
    </button>
  )
}

async function renderPreview(text: string): Promise<string> {
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g
  const parts: { type: 'text' | 'code'; content: string; lang?: string }[] = []
  let last = 0
  let match

  while ((match = codeBlockRegex.exec(text)) !== null) {
    if (match.index > last) parts.push({ type: 'text', content: text.slice(last, match.index) })
    parts.push({ type: 'code', lang: match[1] || 'javascript', content: match[2] })
    last = match.index + match[0].length
  }
  if (last < text.length) parts.push({ type: 'text', content: text.slice(last) })

  const rendered = await Promise.all(parts.map(async (p) => {
    if (p.type === 'code') {
      try {
        return await codeToHtml(p.content.trim(), { lang: p.lang ?? 'javascript', theme: 'one-dark-pro' })
      } catch {
        return await codeToHtml(p.content.trim(), { lang: 'javascript', theme: 'one-dark-pro' })
      }
    }
    return p.content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/_(.*?)_/g, '<em>$1</em>')
      .replace(/<u>(.*?)<\/u>/g, '<u>$1</u>')
      .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 rounded text-sm font-mono">$1</code>')
      .replace(/\n/g, '<br/>')
  }))

  return rendered.join('')
}

interface AnswerEditorProps {
  value: string
  onChange: (value: string) => void
}

export function AnswerEditor({ value, onChange }: AnswerEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [tab, setTab] = useState<'write' | 'preview'>('write')
  const [preview, setPreview] = useState('')

  useEffect(() => {
    if (tab === 'preview') {
      renderPreview(value).then(setPreview)
    }
  }, [tab, value])

  function wrapSelection(before: string, after: string) {
    const ta = textareaRef.current
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const selected = value.substring(start, end)
    const newValue = value.substring(0, start) + before + selected + after + value.substring(end)
    onChange(newValue)
    requestAnimationFrame(() => {
      ta.focus()
      ta.setSelectionRange(start + before.length, end + before.length)
    })
  }

  return (
    <div className="rounded-2xl border border-gray-200 overflow-hidden focus-within:ring-2 focus-within:ring-orange-300 transition-all">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 bg-gray-50">
        {/* Format buttons — hidden in preview */}
        <div className={`flex items-center gap-1 transition-opacity ${tab === 'preview' ? 'opacity-30 pointer-events-none' : ''}`}>
          <ToolbarButton onClick={() => wrapSelection('**', '**')} title="Bold">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <path d="M6 4h8a4 4 0 0 1 0 8H6zm0 8h9a4 4 0 0 1 0 8H6z"/>
            </svg>
          </ToolbarButton>

          <ToolbarButton onClick={() => wrapSelection('_', '_')} title="Italic">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/>
            </svg>
          </ToolbarButton>

          <ToolbarButton onClick={() => wrapSelection('<u>', '</u>')} title="Underline">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <path d="M6 4v6a6 6 0 0 0 12 0V4"/><line x1="4" y1="20" x2="20" y2="20"/>
            </svg>
          </ToolbarButton>

          <div className="w-px h-5 bg-gray-200 mx-1" />

          <ToolbarButton onClick={() => wrapSelection('`', '`')} title="Inline code">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
            </svg>
          </ToolbarButton>

          <ToolbarButton onClick={() => wrapSelection('\n```\n', '\n```')} title="Code block">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
            </svg>
          </ToolbarButton>
        </div>

        {/* Write / Preview tabs */}
        <div className="flex items-center bg-gray-200 rounded-full p-0.5 text-xs font-medium">
          <button
            type="button"
            onClick={() => setTab('write')}
            className={`px-3 py-1 rounded-full transition-all ${tab === 'write' ? 'bg-white text-orange-500 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Write
          </button>
          <button
            type="button"
            onClick={() => setTab('preview')}
            className={`px-3 py-1 rounded-full transition-all ${tab === 'preview' ? 'bg-white text-orange-500 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Preview
          </button>
        </div>
      </div>

      {tab === 'write' ? (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Write your answer here..."
          rows={6}
          className="w-full px-5 py-4 bg-white text-sm text-gray-800 placeholder-gray-400 focus:outline-none resize-none"
        />
      ) : (
        <div
          className="w-full px-5 py-4 bg-white text-sm text-gray-800 min-h-[9rem] [&_pre]:rounded-xl [&_pre]:p-4 [&_pre]:my-3 [&_pre]:overflow-x-auto [&_pre]:text-xs"
          dangerouslySetInnerHTML={{ __html: preview || '<span class="text-gray-400">Nothing to preview.</span>' }}
        />
      )}
    </div>
  )
}
