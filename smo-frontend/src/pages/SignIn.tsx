import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'

function SignIn() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleLogin = async () => {
    setError(null)
    setSubmitting(true)
    try {
      const { error } = await login(email, password)
      if (error) { setError(error); return }
      navigate('/')
    } catch (e) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-8">

        <div onClick={() => navigate('/')} className="text-2xl font-bold text-center mb-2 cursor-pointer hover:-translate-y-1 transition-transform duration-150 inline-block w-full">
          Stack_ <span className="text-orange-500">My_Overflow</span>
        </div>
        <p className="text-center text-gray-400 text-sm mb-8">Welcome back! Please sign in.</p>

        <div className="flex flex-col gap-4">
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

          <div className="flex justify-end">
            <a href="#" className="text-xs text-orange-500 hover:underline">Forgot password?</a>
          </div>

          {error && <p className="text-xs text-red-500 text-center -mb-1">{error}</p>}

          <button
            onClick={handleLogin}
            disabled={submitting}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-semibold py-2 rounded-full transition"
          >
            {submitting ? 'Signing in...' : 'Log In'}
          </button>
        </div>

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-gray-200"></div>
          <span className="text-xs text-gray-400">or</span>
          <div className="flex-1 h-px bg-gray-200"></div>
        </div>

        <p className="text-center text-sm text-gray-500">
          Don't have an account?{' '}
          <a href="/signup" className="text-orange-500 font-medium hover:underline">Sign Up</a>
        </p>

      </div>
    </div>
  )
}

export default SignIn