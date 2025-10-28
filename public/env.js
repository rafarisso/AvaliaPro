const currentEnv = window.ENV || {};
window.ENV = {
  VITE_SUPABASE_URL: currentEnv.VITE_SUPABASE_URL || 'https://SEU-PROJETO.supabase.co',
  VITE_SUPABASE_ANON_KEY: currentEnv.VITE_SUPABASE_ANON_KEY || 'SUA-CHAVE-ANON',
  PROTOTYPE_MODE: 'true'
};

