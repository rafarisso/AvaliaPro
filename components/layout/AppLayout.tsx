import React from 'react';
import { Link, Outlet } from 'react-router-dom';

export default function AppLayout() {
  return (
    <>
      <header style={{padding:'16px', borderBottom:'1px solid #eee', display:'flex', gap:16}}>
        <strong style={{fontSize:18}}>AvaliaPro</strong>
        <nav style={{display:'flex', gap:12}}>
          <Link to="/">Início</Link>
          <Link to="/login">Entrar</Link>
          <Link to="/dashboard">Dashboard</Link>
        </nav>
      </header>
      <main style={{maxWidth:960, margin:'24px auto', padding:'0 16px'}}>
        <Outlet />
      </main>
      <footer style={{padding:'16px', borderTop:'1px solid #eee', textAlign:'center'}}>
        © {new Date().getFullYear()} AvaliaPro
      </footer>
    </>
  );
}