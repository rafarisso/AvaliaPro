import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getEnv } from './env';

let client: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient => {
  if (client) return client;

  const { VITE_SUPABASE_URL: supabaseUrl, VITE_SUPABASE_ANON_KEY: supabaseAnonKey } = getEnv();

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  client = createClient(supabaseUrl, supabaseAnonKey);
  return client;
};
