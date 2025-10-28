import React from 'react';
import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <section>
      <h1>Bem-vindo ao AvaliaPro</h1>
      <p>Crie avalia��es, planos e relat�rios com IA (Gemini + Supabase).</p>
      <div style={{display:'flex', gap:12, marginTop:12}}>
        <Link to="/login">Entrar</Link>
        <Link to="/dashboard">Ir ao Dashboard</Link>
      </div>
    </section>
  );
}
