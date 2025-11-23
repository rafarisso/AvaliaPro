import React from 'react'
import { Link } from 'react-router-dom'

export default function Header() {
  const isDev = Boolean(import.meta.env?.DEV)

  return (
    <header className="w-full border-b bg-white/70 backdrop-blur">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/AvaliaPro_logo.svg" alt="AvaliaPro" className="h-7" />
          <span className="sr-only">AvaliaPro</span>
        </div>
        <nav className="flex items-center gap-6 text-sm">
          <Link to="/dashboard" className="text-gray-700 hover:text-black transition">Dashboard</Link>
          <Link to="/avaliacoes/nova" className="text-gray-700 hover:text-black transition">Criar avaliação</Link>
          <Link to="/modelos" className="text-gray-700 hover:text-black transition">Criar slides</Link>
          {isDev && (
            <Link to="/health" className="text-gray-500 hover:text-black">Health</Link>
          )}
        </nav>
      </div>
    </header>
  )
}
