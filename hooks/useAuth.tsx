import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { checkAccess } from '../src/utils/access'
import { getSupabase } from '../services/supabaseClient'

interface AuthContextType {
  session: Session | null
  user: User | null
  loading: boolean
  loginWithPassword: (email: string, password: string) => Promise<void>
  loginWithOAuth: (provider: 'google' | 'github' | 'azure') => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const auditAccess = useCallback(async (currentUser: User | null) => {
    if (!currentUser) return
    const { allowed, reason } = await checkAccess(currentUser)
    if (!allowed) {
      console.warn('Acesso permitido temporariamente no modo protótipo:', reason)
    }
  }, [])

  useEffect(() => {
    const supabase = getSupabase()
    let mounted = true

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      const nextSession = data.session ?? null
      const nextUser = nextSession?.user ?? null
      setSession(nextSession)
      setUser(nextUser)
      void auditAccess(nextUser)
      setLoading(false)
    })

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!mounted) return
      const nextSession = newSession ?? null
      const nextUser = nextSession?.user ?? null
      setSession(nextSession)
      setUser(nextUser)
      void auditAccess(nextUser)
      setLoading(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [auditAccess])

  const loginWithPassword = async (email: string, password: string) => {
    const supabase = getSupabase()
    setLoading(true)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setLoading(false)
      throw error
    }
    const nextSession = data.session ?? null
    const nextUser = nextSession?.user ?? null
    setSession(nextSession)
    setUser(nextUser)
    void auditAccess(nextUser)
    setLoading(false)
  }

  const loginWithOAuth = async (provider: 'google' | 'github' | 'azure') => {
    const supabase = getSupabase()
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) throw error
  }

  const logout = async () => {
    const supabase = getSupabase()
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    setSession(null)
    setUser(null)
  }

  const value: AuthContextType = {
    session,
    user,
    loading,
    loginWithPassword,
    loginWithOAuth,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
