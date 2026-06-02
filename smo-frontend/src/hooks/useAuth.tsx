import { createContext, useContext, useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthContextType {
  user: User | null
  username: string | null
  reputation: number | null
  accessToken: string | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ error: string | null }>
  register: (username: string, email: string, password: string) => Promise<{ error: string | null }>
  logout: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string

// Raw fetch — evita clientul Supabase JS care poate bloca din cauza mutex-ului intern
async function fetchProfile(userId: string, token: string): Promise<{ username: string | null; reputation: number | null }> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=username,reputation&limit=1`,
    { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${token}` } }
  )
  if (!res.ok) return { username: null, reputation: null }
  const rows = await res.json()
  return { username: rows[0]?.username ?? null, reputation: rows[0]?.reputation ?? null }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [username, setUsername] = useState<string | null>(null)
  const [reputation, setReputation] = useState<number | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  async function applyProfile(userId: string, token: string) {
    const p = await fetchProfile(userId, token)
    setUsername(p.username)
    setReputation(p.reputation)
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      try {
        setUser(session?.user ?? null)
        setAccessToken(session?.access_token ?? null)
        if (session?.access_token) {
          localStorage.setItem('smo_token', session.access_token)
          localStorage.setItem('smo_refresh', session.refresh_token ?? '')
        }
        if (session?.user && session.access_token) await applyProfile(session.user.id, session.access_token)
      } catch (e) {
        console.error('Error restoring session:', e)
      } finally {
        setIsLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null)
      setAccessToken(session?.access_token ?? null)
      if (session?.user && session.access_token) {
        await applyProfile(session.user.id, session.access_token)
      } else {
        setUsername(null)
        setReputation(null)
      }
      if (session?.access_token) {
        localStorage.setItem('smo_token', session.access_token)
        localStorage.setItem('smo_refresh', session.refresh_token ?? '')
      } else {
        localStorage.removeItem('smo_token')
        localStorage.removeItem('smo_refresh')
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (!error && data.user && data.session) {
      setUser(data.user)
      setAccessToken(data.session.access_token)
      localStorage.setItem('smo_token', data.session.access_token)
      localStorage.setItem('smo_refresh', data.session.refresh_token ?? '')
      await applyProfile(data.user.id, data.session.access_token)
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
    setReputation(null)
    setAccessToken(null)
    localStorage.removeItem('smo_token')
    localStorage.removeItem('smo_refresh')
    await supabase.auth.signOut()
  }

  const refreshProfile = async () => {
    const token = localStorage.getItem('smo_token')
    if (user && token) await applyProfile(user.id, token)
  }

  return (
    <AuthContext.Provider value={{ user, username, reputation, accessToken, isLoading, login, register, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}
