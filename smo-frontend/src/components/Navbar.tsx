import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export function Navbar() {
  const navigate = useNavigate()
  const { user, username, logout } = useAuth()

  const handleLogout = async () => {
    try {
      await logout()
    } catch (e) {
      console.error('Logout error:', e)
    }
    navigate('/')
  }

  return (
    <header className="w-full border-b-4 border-orange-500 px-4 pt-5 pb-5 flex justify-between items-center">
      <span
        onClick={() => navigate('/')}
        className="text-4xl font-bold tracking-tight inline-block hover:-translate-y-2 transition-transform duration-150 cursor-pointer"
      >
        Stack_ <span className="text-orange-500">My_Overflow</span>
      </span>

      <div className="flex items-center gap-3">
        {user ? (
          <>
            <span className="text-sm font-medium text-gray-700">
              👤 {username ?? user.email}
            </span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-full border border-orange-500 text-orange-500 text-sm font-medium hover:bg-orange-50 transition"
            >
              Log Out
            </button>
          </>
        ) : (
          <>
            <button onClick={() => navigate('/signin')} className="px-4 py-2 rounded-full border border-orange-500 text-orange-500 text-sm font-medium hover:bg-orange-50 transition">
              Log In
            </button>
            <button onClick={() => navigate('/signup')} className="px-4 py-2 rounded-full bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 transition">
              Sign Up
            </button>
          </>
        )}
      </div>
    </header>
  )
}
