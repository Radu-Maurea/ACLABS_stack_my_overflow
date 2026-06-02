import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { request } from '../lib/api'

interface UpvoteProps {
  count: number
  targetId: string
  targetType: 'question' | 'answer'
  voted?: boolean
}

export function Upvote({ count: initialCount, targetId, targetType, voted: initialVoted = false }: UpvoteProps) {
  const { user, accessToken } = useAuth()
  const [count, setCount] = useState(initialCount)
  const [voted, setVoted] = useState(initialVoted)
  const [loading, setLoading] = useState(false)

  const handleVote = async (e: React.MouseEvent) => {
    e.stopPropagation() // nu navigam spre pagina intrebarii cand dam click pe vot
    if (!user || loading) return

    // Update optimist — apare instant, fara sa asteptam serverul
    const wasVoted = voted
    setVoted(!wasVoted)
    setCount((c) => (wasVoted ? c - 1 : c + 1))

    try {
      const endpoint = targetType === 'question'
        ? `/questions/${targetId}/vote`
        : `/answers/${targetId}/vote`

      // Pasam accessToken direct din context — mai sigur decat localStorage
      const data = await request<{ vote_count: number; voted: boolean }>(endpoint, {
        method: 'PATCH',
        body: JSON.stringify({ value: 1 }),
      }, accessToken)

      // Sincronizam cu raspunsul real al serverului
      setCount(data.vote_count)
      setVoted(data.voted)
    } catch {
      // Revenim la starea anterioara daca serverul a returnat eroare
      setVoted(wasVoted)
      setCount((c) => (wasVoted ? c + 1 : c - 1))
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleVote}
      disabled={loading}
      title={!user ? 'Trebuie să fii logat pentru a vota' : voted ? 'Retrage votul' : 'Votează'}
      className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full transition-all select-none
        ${voted
          ? 'text-orange-500 bg-orange-50 shadow-sm shadow-orange-200'
          : user
            ? 'text-gray-600 hover:text-orange-500 hover:bg-orange-50 hover:shadow-sm hover:shadow-orange-200'
            : 'text-gray-400 cursor-default'
        }
      `}
    >
      ⬆ {count}
    </button>
  )
}
