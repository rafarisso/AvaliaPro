import React from 'react'
import { Link } from 'react-router-dom'

export default function Header() {
  return (
    <header className="w-full border-b bg-white/70 backdrop-blur">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/AvaliaPro_logo.svg" alt="AvaliaPro" className="h-7" />
          <span className="sr-only">AvaliaPro</span>
        </div>
        <nav className="flex items-center gap-6 text-sm">
          <Link to="/" className="text-gray-700 hover:text-black">Início</Link>
          <Link to="/login" className="text-gray-700 hover:text-black">Entrar</Link>
          <Link to="/dashboard" className="text-gray-700 hover:text-black">Dashboard</Link>
        </nav>
      </div>
    </header>
  )
}
