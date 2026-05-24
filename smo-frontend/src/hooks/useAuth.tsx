import { createContext, useContext, useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthContextType {
  user: User | null
  username: string | null
  accessToken: string | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ error: string | null }>
  register: (username: string, email: string, password: string) => Promise<{ error: string | null }>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

async function fetchUsername(userId: string): Promise<string | null> {
  const { data } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', userId)
    .single()
  return data?.username ?? null
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [username, setUsername] = useState<string | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Restore session on mount — getSession() is only called once here at startup
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      try {
        setUser(session?.user ?? null)
        setAccessToken(session?.access_token ?? null)
        if (session?.user) setUsername(await fetchUsername(session.user.id))
      } catch (e) {
        console.error('Error restoring session:', e)
      } finally {
        setIsLoading(false)
      }
    })

    // Keep token in sync whenever auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null)
      setAccessToken(session?.access_token ?? null)
      setUsername(session?.user ? await fetchUsername(session.user.id) : null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (!error && data.user && data.session) {
      setUser(data.user)
      setAccessToken(data.session.access_token)
      setUsername(await fetchUsername(data.user.id))
    }
    return { error: error?.message ?? null }
  }

  const register = async (username: string, email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    })
    if (error) return { error: error.message }
    return { error: null }
  }

  const logout = async () => {
    setUser(null)
    setUsername(null)
    setAccessToken(null)
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, username, accessToken, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}
