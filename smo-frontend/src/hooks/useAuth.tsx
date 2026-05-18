import { useState } from 'react'

interface User {
  id: string
  username: string
  email: string
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
}

export function useAuth() {
  const [auth, setAuth] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: false,
  })

  const login = async (email: string, password: string) => {
    setAuth((prev) => ({ ...prev, isLoading: true }))

    // mock delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // mock user
    setAuth({
      user: { id: 'u1', username: 'radum', email },
      isAuthenticated: true,
      isLoading: false,
    })
  }

  const logout = () => {
    setAuth({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    })
  }

  const register = async (username: string, email: string, password: string) => {
    setAuth((prev) => ({ ...prev, isLoading: true }))

    // mock delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // mock new user
    setAuth({
      user: { id: 'u99', username, email },
      isAuthenticated: true,
      isLoading: false,
    })
  }

  return {
    user: auth.user,
    isAuthenticated: auth.isAuthenticated,
    isLoading: auth.isLoading,
    login,
    logout,
    register,
  }
}