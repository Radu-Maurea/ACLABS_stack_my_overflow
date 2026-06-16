import { useLocation, useNavigate } from 'react-router-dom'

const items = [
  {
    label: 'Users',
    path: '/users',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
      </svg>
    ),
  },
]

export function Sidebar() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  return (
    <aside className="fixed left-2 top-36 w-44">
      <div className="flex flex-col gap-0.5 p-2 bg-white border border-gray-100 rounded-2xl shadow-sm">
        {items.map((item) => {
          const active = pathname === item.path
          return (
            <button
              key={item.path}
              onClick={() => navigate(active ? '/' : item.path)}
              className={`flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                active
                  ? 'bg-orange-50 text-orange-500'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          )
        })}
      </div>
    </aside>
  )
}
