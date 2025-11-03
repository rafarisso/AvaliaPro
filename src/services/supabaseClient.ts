import { createClient, type SupabaseClient } from "@supabase/supabase-js"

type Env = {
  VITE_SUPABASE_URL?: string
  VITE_SUPABASE_ANON_KEY?: string
}

const runtimeEnv: Env = (typeof window !== "undefined" && (window as any).ENV) || {}

const SUPABASE_URL = (
  runtimeEnv.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL || ""
)
  .toString()
  .trim()

const SUPABASE_ANON_KEY = (
  runtimeEnv.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || ""
)
  .toString()
  .trim()

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  const shortUrl = SUPABASE_URL
    ? `${SUPABASE_URL.slice(0, 4)}… (len=${SUPABASE_URL.length})`
    : "(vazio)"

  console.warn("[Supabase] Variáveis ausentes em runtime.", {
    url: shortUrl,
    anonKeyPresent: Boolean(SUPABASE_ANON_KEY),
  })
}

export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

export function getSupabase(): SupabaseClient {
  return supabase
}

if (typeof window !== "undefined") {
  ;(window as any).supabase = supabase
}
