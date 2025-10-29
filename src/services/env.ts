export function getEnv() {
  const w: any = globalThis.window ?? {};
  const E = (w.ENV ?? {}) as Record<string, string>;

  const runtime = {
    VITE_SUPABASE_URL: (E.VITE_SUPABASE_URL ?? import.meta.env.VITE_SUPABASE_URL)?.trim?.(),
    VITE_SUPABASE_ANON_KEY: (E.VITE_SUPABASE_ANON_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY)?.trim?.(),
    PROTOTYPE_MODE: (E.PROTOTYPE_MODE ?? import.meta.env.PROTOTYPE_MODE ?? 'false')
      .toString()
      .toLowerCase() === 'true',
  };

  return runtime;
}
