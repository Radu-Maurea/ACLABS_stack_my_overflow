import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

function SignUp() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-8">

        <div onClick={() => navigate('/')} className="text-2xl font-bold text-center mb-2 cursor-pointer hover:-translate-y-1 transition-transform duration-150 inline-block w-full">
          Stack_ <span className="text-orange-500">My_Overflow</span>
        </div>
        <p className="text-center text-gray-400 text-sm mb-8">Create your account.</p>

        <div className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium text-gray-600 mb-1 block">Username</label>
            <input
              type="text"
              placeholder="your_username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600 mb-1 block">Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600 mb-1 block">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>

          <button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 rounded-full transition">
            Sign Up
          </button>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <a onClick={() => navigate('/signin')} className="text-orange-500 font-medium hover:underline cursor-pointer">Log In</a>
        </p>

      </div>
    </div>
  )
}

export default SignUp
