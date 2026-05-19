import { useNavigate } from 'react-router-dom'

export function Navbar() {
  const navigate = useNavigate()
  return (
    <header className="w-full border-b-4 border-orange-500 px-4 pt-5 pb-5 flex justify-between items-center">
      <span
        onClick={() => navigate('/')}
        className="text-4xl font-bold tracking-tight inline-block hover:-translate-y-2 transition-transform duration-150 cursor-pointer"
      >
        Stack_ <span className="text-orange-500">My_Overflow</span>
      </span>
      <div className="flex gap-3">
        <button onClick={() => navigate('/signin')} className="px-4 py-2 rounded-full border border-orange-500 text-orange-500 text-sm font-medium hover:bg-orange-50 transition">
          Log In
        </button>
        <button onClick={() => navigate('/signup')} className="px-4 py-2 rounded-full bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 transition">
          Sign Up
        </button>
      </div>
    </header>
  )
}
