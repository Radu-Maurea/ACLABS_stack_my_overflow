import { useState } from 'react'

export function Upvote({ count }: { count: number }) {
  const [hovered, setHovered] = useState(false)
  return (
    <span
      className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full transition-all ${hovered ? 'text-orange-500 shadow-md shadow-orange-200' : 'text-gray-700'}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      ⬆ {count}
    </span>
  )
}


