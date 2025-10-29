import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { getEnv } from './env'

let client: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (client) return client

  const { VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY } = getEnv()

  if (!VITE_SUPABASE_URL || !VITE_SUPABASE_ANON_KEY) {
    throw new Error('Supabase env missing')
  }

  client = createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, {
    auth: {
      flowType: 'pkce',
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  })

  return client
}
