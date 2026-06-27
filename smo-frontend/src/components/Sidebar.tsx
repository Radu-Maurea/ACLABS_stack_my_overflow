import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

type Item = { label: string; path: string; icon: React.ReactNode }

const baseItems: Item[] = [
  {
    label: 'Questions',
    path: '/',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
      </svg>
    ),
  },
  {
    label: 'Tags',
    path: '/tags',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M21.41 11.58l-9-9A2 2 0 0 0 11 2H4a2 2 0 0 0-2 2v7a2 2 0 0 0 .59 1.42l9 9A2 2 0 0 0 13 22a2 2 0 0 0 1.41-.59l7-7A2 2 0 0 0 22 13a2 2 0 0 0-.59-1.42zM5.5 7A1.5 1.5 0 1 1 7 5.5 1.5 1.5 0 0 1 5.5 7z" />
      </svg>
    ),
  },
  {
    label: 'Top Users',
    path: '/users',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
      </svg>
    ),
  },
  {
    label: 'Unanswered',
    path: '/?filter=unanswered',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z" />
      </svg>
    ),
  },
]

const myQuestionsItem: Item = {
  label: 'My Questions',
  path: '/?filter=mine',
  icon: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2a5 5 0 1 0 0 10A5 5 0 0 0 12 2zm0 12c-5.33 0-8 2.67-8 4v2h16v-2c0-1.33-2.67-4-8-4z" />
    </svg>
  ),
}

export function Sidebar() {
  const navigate = useNavigate()
  const { pathname, search } = useLocation()
  const { user } = useAuth()

  const items = user ? [...baseItems, myQuestionsItem] : baseItems

  function isActive(path: string) {
    const [itemPath, itemQuery] = path.split('?')
    if (itemQuery) return pathname === itemPath && search === `?${itemQuery}`
    return pathname === itemPath && !search.startsWith('?filter=')
  }

  return (
    <aside className="fixed left-2 top-16 w-14 flex flex-col items-center gap-1 py-3 bg-white border border-gray-100 rounded-2xl shadow-sm">
      {items.map((item) => (
        <div key={item.path} className="relative group">
          <button
            onClick={() => navigate(item.path)}
            className={`flex items-center justify-center w-10 h-10 rounded-xl transition-colors ${
              isActive(item.path)
                ? 'bg-orange-50 text-orange-500'
                : 'text-gray-400 hover:bg-gray-100 hover:text-gray-700'
            }`}
          >
            {item.icon}
          </button>
          <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2.5 py-1.5 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
            {item.label}
          </div>
        </div>
      ))}
    </aside>
  )
}
