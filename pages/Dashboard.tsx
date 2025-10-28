import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { useSchool } from '../hooks/useSchool';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { escola } = useSchool();
  return (
    <section>
      <h2>Dashboard</h2>
      <p>Usuário: {user?.email ?? '—'}</p>
      <p>Escola: {escola?.nome ?? '—'}</p>
      <div style={{display:'flex', gap:12, marginTop:12}}>
        <button onClick={logout}>Sair</button>
      </div>
    </section>
  );
}
