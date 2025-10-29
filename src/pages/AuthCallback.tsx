import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSupabase } from '../services/supabaseClient'

export default function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    const run = async () => {
      try {
        const supabase = getSupabase()
        await supabase.auth.exchangeCodeForSession(window.location.href)
      } catch (error: any) {
        if (error?.message && !/PKCE code verifier not found/i.test(error.message)) {
          console.error('Auth callback error', error)
        }
      } finally {
        navigate('/dashboard', { replace: true })
      }
    }

    run()
  }, [navigate])

  return null
}
