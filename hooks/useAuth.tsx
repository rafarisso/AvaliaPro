import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import type { Session, User } from "@supabase/supabase-js"
import { getSupabase } from "../services/supabaseClient"

type Profile = {
  id: string
  email?: string | null
  full_name?: string | null
  onboarding_completed?: boolean | null
  teaching_grade_levels?: string[] | null
  [key: string]: unknown
}

interface AuthContextType {
  session: Session | null
  user: User | null
  profile: Profile | null
  loading: boolean
  loginWithPassword: (email: string, password: string) => Promise<void>
  loginWithOAuth: (provider: "google" | "github" | "azure") => Promise<void>
  logout: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export async function auditEvent(event: string, meta: Record<string, unknown> = {}) {
  try {
    const supabase = getSupabase()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from("user_events").insert({
      user_id: user.id,
      event,
      meta,
    })
  } catch (error) {
    console.warn("[auditEvent]", error)
  }
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider")
  return ctx
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const supabase = useMemo(() => getSupabase(), [])

  const loadProfile = useCallback(
    async (currentUser: User | null) => {
      if (!currentUser) {
        setProfile(null)
        return
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, full_name, onboarding_completed, teaching_grade_levels")
        .eq("id", currentUser.id)
        .maybeSingle()

      if (data) {
        setProfile(data as Profile)
        return
      }

      if (error && error.code !== "PGRST116") {
        console.warn("[Auth] Falha ao carregar profile", error)
      }

      const { data: upserted, error: upsertError } = await supabase
        .from("profiles")
        .upsert(
          {
            id: currentUser.id,
            email: currentUser.email ?? null,
            full_name: currentUser.user_metadata?.full_name ?? null,
          },
          { onConflict: "id" }
        )
        .select("id, email, full_name, onboarding_completed, teaching_grade_levels")
        .single()

      if (upsertError) {
        console.warn("[Auth] Falha ao criar profile", upsertError)
        setProfile(null)
        return
      }

      setProfile(upserted as Profile)
    },
    [supabase]
  )

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return

      const nextSession = data.session ?? null
      const nextUser = nextSession?.user ?? null
      setSession(nextSession)
      setUser(nextUser)
      await loadProfile(nextUser)
      if (mounted) setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!mounted) return
      const nextSession = newSession ?? null
      const nextUser = nextSession?.user ?? null
      setSession(nextSession)
      setUser(nextUser)
      await loadProfile(nextUser)
      if (mounted) setLoading(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [loadProfile, supabase])

  const loginWithPassword = async (email: string, password: string) => {
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
    await loadProfile(nextUser)
    setLoading(false)
  }

  const loginWithOAuth = async (provider: "google" | "github" | "azure") => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) throw error
  }

  const logout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    setSession(null)
    setUser(null)
    setProfile(null)
  }

  const refreshProfile = useCallback(async () => {
    await loadProfile(user)
  }, [loadProfile, user])

  const value: AuthContextType = {
    session,
    user,
    profile,
    loading,
    loginWithPassword,
    loginWithOAuth,
    logout,
    refreshProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
