import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSupabase } from '../services/supabaseClient';
import { useToast } from '../hooks/useToast';

export default function Login() {
  const nav = useNavigate();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const supabase = getSupabase();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return showToast(error.message, 'error');
    showToast('Login realizado!', 'success');
    nav('/dashboard');
  };

  return (
    <form onSubmit={onSubmit} style={{display:'grid', gap:12, maxWidth:360}}>
      <h2>Entrar</h2>
      <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
      <input type="password" placeholder="Senha" value={password} onChange={e=>setPassword(e.target.value)} />
      <button disabled={loading}>{loading ? 'Entrando…' : 'Entrar'}</button>
    </form>
  );
}
